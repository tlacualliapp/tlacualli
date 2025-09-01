

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, getDoc, doc, where, getDocs, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  recipeId?: string;
  inventoryItemId?: string;
  status?: 'active' | 'inactive';
}

interface Recipe {
    id: string;
    ingredients: { itemId: string; quantity: number, itemName: string }[];
}

interface InventoryItem {
    id: string;
    name: string;
    currentStock: number;
}


interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  subAccountId: string;
  status?: 'pending' | 'preparing' | 'ready';
  recipeId?: string;
  inventoryItemId?: string;
  categoryId?: string;
}

interface SubAccount {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface MissingIngredient {
    name: string;
    required: number;
    inStock: number;
}

interface MenuSelectionProps {
  restaurantId: string;
  userPlan: string;
  orderId: string;
  tableName: string;
  onBack: () => void;
  subAccountId: string;
}

export const MenuSelection = ({ restaurantId, userPlan, orderId, tableName, onBack, subAccountId }: MenuSelectionProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState(subAccountId);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');

  const [isInventoryAlertOpen, setIsInventoryAlertOpen] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState<MissingIngredient[]>([]);
  
  const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

  useEffect(() => {
    if (!restaurantId) return;

    setIsLoading(true);
    const categoriesQuery = query(collection(db, `${collectionName}/${restaurantId}/menuCategories`));
    const itemsQuery = query(
        collection(db, `${collectionName}/${restaurantId}/menuItems`),
        where('status', '==', 'active')
    );
    const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, orderId);

    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
      setIsLoading(false);
    });

    const unsubOrder = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data();
        setSubAccounts(orderData.subaccounts || [{ id: 'main', name: t('General') }]);
      }
    });

    return () => {
      unsubCategories();
      unsubItems();
      unsubOrder();
    };
  }, [restaurantId, orderId, collectionName, t]);
  
  const handleSelectItem = async (item: MenuItem) => {
    setSelectedItemForNotes(item); // Set the item for later use
    
    try {
        const missing: MissingIngredient[] = [];
        // Case 1: Item is based on a recipe
        if (item.recipeId && item.recipeId !== 'none') {
            const recipeRef = doc(db, `${collectionName}/${restaurantId}/recipes`, item.recipeId);
            const recipeSnap = await getDoc(recipeRef);

            if (!recipeSnap.exists()) {
                toast({ variant: 'destructive', title: t('Error'), description: t('Recipe not found for this item.') });
                return;
            }

            const recipe = recipeSnap.data() as Recipe;
            for (const ingredient of recipe.ingredients) {
                const invItemRef = doc(db, `${collectionName}/${restaurantId}/inventoryItems`, ingredient.itemId);
                const invItemSnap = await getDoc(invItemRef);
                
                if (invItemSnap.exists()) {
                    const inventoryItem = invItemSnap.data() as InventoryItem;
                    if (inventoryItem.currentStock < ingredient.quantity) {
                        missing.push({
                            name: inventoryItem.name,
                            required: ingredient.quantity,
                            inStock: inventoryItem.currentStock
                        });
                    }
                } else {
                    missing.push({ name: ingredient.itemName, required: ingredient.quantity, inStock: 0 });
                }
            }
        // Case 2: Item is a direct inventory item
        } else if (item.inventoryItemId) {
            const invItemRef = doc(db, `${collectionName}/${restaurantId}/inventoryItems`, item.inventoryItemId);
            const invItemSnap = await getDoc(invItemRef);
            if(invItemSnap.exists()) {
                const inventoryItem = invItemSnap.data() as InventoryItem;
                if (inventoryItem.currentStock < 1) { // Assuming it consumes 1 unit
                    missing.push({ name: inventoryItem.name, required: 1, inStock: inventoryItem.currentStock });
                }
            } else {
                 missing.push({ name: item.name, required: 1, inStock: 0 });
            }
        }
        
        if (missing.length > 0) {
            setMissingIngredients(missing);
            setIsInventoryAlertOpen(true);
        } else {
            // All ingredients are available, open notes modal
            setItemNotes('');
            setIsNotesModalOpen(true);
        }

    } catch (error) {
        console.error("Error checking inventory:", error);
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not check inventory.')});
    }
  };

  const confirmAddItemAnyway = () => {
    setIsInventoryAlertOpen(false);
    setItemNotes('');
    setIsNotesModalOpen(true);
  }

  const handleAddItemToOrder = async () => {
    if (!selectedItemForNotes || !restaurantId || !orderId) {
        toast({ variant: 'destructive', title: t('Error'), description: t('No active order or item selected.') });
        return;
    }
    
    setIsNotesModalOpen(false);
    const orderRef = doc(db, `${collectionName}/${restaurantId}/orders`, orderId);

    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                 throw new Error(t("Order document does not exist!"));
            }

            const orderData = orderDoc.data();
            let currentItems: OrderItem[] = orderData.items || [];
            let updatedItems;

            // Add new item, as each addition with notes should be unique
            updatedItems = [...currentItems, { 
                id: selectedItemForNotes.id, 
                name: selectedItemForNotes.name, 
                price: selectedItemForNotes.price, 
                quantity: 1, 
                subAccountId: selectedSubAccountId,
                status: 'pending',
                notes: itemNotes.trim(),
                recipeId: selectedItemForNotes.recipeId,
                inventoryItemId: selectedItemForNotes.inventoryItemId,
                categoryId: selectedItemForNotes.categoryId
            }];

            const newSubtotal = updatedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
            
            const updatePayload: any = { 
                items: updatedItems, 
                subtotal: newSubtotal 
            };

            // If order was already served, change status to 'preparing' to signal new items.
            if (orderData.status === 'served') {
                updatePayload.status = 'preparing';
                updatePayload.sentToKitchenAt = serverTimestamp(); // new items sent now
                updatePayload.pickupAcknowledgedAt = null;
            } else if (orderData.status === 'new') { // If it's a delivery order, move it to preparing
                updatePayload.status = 'preparing';
            }
            
            transaction.update(orderRef, updatePayload);
        });
        
        toast({
            title: `${t('Added')}!`,
            description: t('{{itemName}} has been added to the order.', {itemName: selectedItemForNotes.name})
        })

    } catch (error) {
        console.error("Error adding item to order:", error);
        toast({ variant: 'destructive', title: t('Error'), description: (error as Error).message || t('Could not add item to order.') });
    } finally {
        setSelectedItemForNotes(null);
        setItemNotes('');
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <h2 className="text-xl font-bold font-headline ml-2">{t('Add to Order')}: {tableName}</h2>
      </div>

       <div className="grid grid-cols-2 gap-4 mb-4">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("Search items...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Select value={selectedSubAccountId} onValueChange={setSelectedSubAccountId}>
                <SelectTrigger>
                    <SelectValue placeholder={t('Select a sub-account')} />
                </SelectTrigger>
                <SelectContent>
                    {subAccounts.map(sa => (
                        <SelectItem key={sa.id} value={sa.id}>{sa.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
      
      {categories.length > 0 ? (
        <Tabs defaultValue={categories[0].id} className="flex-grow flex flex-col">
          <TabsList className="w-full">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex-1">{cat.name}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="flex-grow overflow-y-auto mt-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredMenuItems.filter(item => item.categoryId === cat.id).map(item => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
                    onClick={() => handleSelectItem(item)}
                  >
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center text-muted-foreground mt-8">{t('No menu categories found.')}</div>
      )}
    </div>

    <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Special Instructions for')}: {selectedItemForNotes?.name}</DialogTitle>
             <DialogDescription>{t('Add any specific preparation notes for this item.')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="item-notes">{t('Notes')}</Label>
            <Textarea 
              id="item-notes" 
              value={itemNotes} 
              onChange={(e) => setItemNotes(e.target.value)} 
              placeholder={t('e.g., Sin cebolla, extra picante...')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesModalOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handleAddItemToOrder}>{t('Add to Order')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <AlertDialog open={isInventoryAlertOpen} onOpenChange={setIsInventoryAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    {t('Insufficient Ingredients')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {t('The following ingredients do not have enough stock:')}
                </AlertDialogDescription>
                <div className="pt-2">
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {missingIngredients.map(ing => (
                        <li key={ing.name}>
                            {ing.name} ({t('Required')}: {ing.required}, {t('In Stock')}: {ing.inStock})
                        </li>
                    ))}
                    </ul>
                </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAddItemAnyway}>
                    {t('Confirm Anyway')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

    