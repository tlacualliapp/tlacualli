
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, runTransaction, getDoc, getDocs, DocumentData, collectionGroup, limit } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ChefHat, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KitchenOrderCard, Order, OrderItem } from '@/components/kitchen/order-card';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getRestaurantIdForCurrentUser } from '@/lib/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Recipe {
    id: string;
    ingredients: { itemId: string; quantity: number }[];
}

interface InventoryUpdate {
    ref: any; // DocumentReference
    newStock: number;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const id = await getRestaurantIdForCurrentUser();
        setRestaurantId(id);
      }
    };
    fetchRestaurantId();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) {
        if (!user) setIsLoading(false);
        return;
    };

    const q = query(
      collection(db, `restaurantes/${restaurantId}/orders`), 
      where('status', 'in', ['preparing', 'ready_for_pickup'])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .sort((a, b) => (a.sentToKitchenAt?.toMillis() || 0) - (b.sentToKitchenAt?.toMillis() || 0));
      
      setOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching kitchen orders:", error);
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not load kitchen orders.') });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, t, toast, user]);

  const handleItemStatusChange = async (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    if (!restaurantId) return;

    const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, orderId);
    
    try {
        await runTransaction(db, async (transaction) => {
            // --- 1. READS ---
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw new Error(t("Order document not found."));
            }

            const currentOrder = { id: orderDoc.id, ...orderDoc.data() } as Order;
            const itemIndex = currentOrder.items.findIndex((item, index) => `${item.id}-${index}` === itemId);
            if (itemIndex === -1) {
                throw new Error(t("Item not found in order."));
            }

            const orderItem = currentOrder.items[itemIndex];

            if (orderItem.status === newStatus || orderItem.status === 'ready') {
                return; // No change needed
            }

            const inventoryUpdates: InventoryUpdate[] = [];

            if (newStatus === 'ready') {
                const menuItemRef = doc(db, `restaurantes/${restaurantId}/menuItems`, orderItem.id);
                const menuItemSnap = await transaction.get(menuItemRef);

                if (menuItemSnap.exists()) {
                    const menuItemData = menuItemSnap.data();
                    // Case 1: Item is made from a recipe
                    if (menuItemData.recipeId && menuItemData.recipeId !== 'none') {
                        const recipeId = menuItemData.recipeId;
                        const recipeRef = doc(db, `restaurantes/${restaurantId}/recipes`, recipeId);
                        const recipeSnap = await transaction.get(recipeRef);

                        if (recipeSnap.exists()) {
                            const recipe = recipeSnap.data() as Recipe;
                            for (const ingredient of recipe.ingredients) {
                                const inventoryItemRef = doc(db, `restaurantes/${restaurantId}/inventoryItems`, ingredient.itemId);
                                const inventoryItemSnap = await transaction.get(inventoryItemRef);
                                if (inventoryItemSnap.exists()) {
                                    const currentStock = inventoryItemSnap.data().currentStock || 0;
                                    const requiredQuantity = ingredient.quantity * orderItem.quantity;
                                    inventoryUpdates.push({
                                        ref: inventoryItemRef,
                                        newStock: currentStock - requiredQuantity,
                                    });
                                }
                            }
                        }
                    // Case 2: Item is a direct inventory item
                    } else if (menuItemData.inventoryItemId) {
                         const inventoryItemRef = doc(db, `restaurantes/${restaurantId}/inventoryItems`, menuItemData.inventoryItemId);
                         const inventoryItemSnap = await transaction.get(inventoryItemRef);
                         if (inventoryItemSnap.exists()) {
                            const currentStock = inventoryItemSnap.data().currentStock || 0;
                            const requiredQuantity = orderItem.quantity; // Consumes 1 unit of itself per quantity
                             inventoryUpdates.push({
                                ref: inventoryItemRef,
                                newStock: currentStock - requiredQuantity,
                            });
                         }
                    }
                }
            }

            // --- 2. WRITES ---
            const updatedItems = [...currentOrder.items];
            updatedItems[itemIndex] = { ...orderItem, status: newStatus };

            const allItemsReady = updatedItems.every(item => item.status === 'ready');
            const updatePayload: any = { items: updatedItems };
            
            // Only update order status for dine-in or regular takeout, not for deliveries.
            // The delivery board will handle the status changes from 'preparing' onwards.
            if (allItemsReady && currentOrder.type !== 'delivery') {
                updatePayload.status = 'ready_for_pickup';
            }
            
            // Perform inventory updates
            inventoryUpdates.forEach(update => {
                transaction.update(update.ref, { currentStock: update.newStock });
            });

            // Finally, update the order
            transaction.update(orderRef, updatePayload);
        });
        
        // This toast is outside the transaction
        if(newStatus === 'ready') {
            const item = orders.find(o => o.id === orderId)?.items.find((item, index) => `${item.id}-${index}` === itemId);
            toast({ title: t('Item Ready'), description: t('{{itemName}} is ready and inventory has been updated.', { itemName: item?.name }) });
        }

    } catch (error) {
       console.error("Error updating item status:", error);
       toast({ variant: 'destructive', title: t('Error'), description: t('Could not update item status. Reason: {{message}}', { message: (error as Error).message }) });
    }
  };


  const handleOrderReady = async (orderId: string) => {
    if (!restaurantId) return;
    try {
      const orderRef = doc(db, `restaurantes/${restaurantId}/orders`, orderId);
      
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder || currentOrder.type === 'delivery') return; // Do not use this for delivery orders

      // Mark all items as ready
      const updatedItems = currentOrder.items.map(item => ({ ...item, status: 'ready' }));

      await updateDoc(orderRef, { 
        status: 'ready_for_pickup',
        items: updatedItems 
      });

      toast({ title: t('Order Ready'), description: t('The order is now ready for pickup.') });
    } catch (error) {
       toast({ variant: 'destructive', title: t('Error'), description: t('Could not mark the order as ready.') });
    }
  };

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <ChefHat className="h-8 w-8" /> {t('Kitchen Management')}
            </CardTitle>
            <CardDescription>{t('View and manage incoming orders in real-time.')}</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
         <Card className="bg-card/65 backdrop-blur-lg">
            <CardContent className="flex flex-col items-center justify-center text-center p-16">
                <h1 className="text-4xl font-bold font-headline mb-4">{t('Kitchen is Clear!')}</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                {t('There are no pending orders at the moment.')}
                </p>
            </CardContent>
         </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {orders.map(order => (
                <KitchenOrderCard 
                    key={order.id} 
                    order={order} 
                    onItemStatusChange={handleItemStatusChange}
                    onOrderReady={handleOrderReady}
                />
            ))}
        </div>
      )}
    </AdminLayout>
  );
}
