
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, getDoc, doc, where, getDocs, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuSelectionProps {
  restaurantId: string;
  orderId: string;
  tableName: string;
  onBack: () => void;
}

export const MenuSelection = ({ restaurantId, orderId, tableName, onBack }: MenuSelectionProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [clickedItemId, setClickedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    setIsLoading(true);
    const categoriesQuery = query(collection(db, `restaurantes/${restaurantId}/menuCategories`));
    const itemsQuery = query(collection(db, `restaurantes/${restaurantId}/menuItems`));

    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
      setIsLoading(false);
    });

    return () => {
      unsubCategories();
      unsubItems();
    };
  }, [restaurantId]);

  const handleAddItemToOrder = async (item: MenuItem) => {
    if (!restaurantId || !orderId) {
        toast({ variant: 'destructive', title: t('Error'), description: t('No active order selected.') });
        return;
    }
    
    setClickedItemId(item.id);
    setTimeout(() => setClickedItemId(null), 300);

    const orderRef = doc(db, 'orders', orderId);

    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                 throw new Error(t("Order document does not exist!"));
            }

            const orderData = orderDoc.data();
            const currentItems: OrderItem[] = orderData.items || [];
            
            const existingItemIndex = currentItems.findIndex(i => i.id === item.id);
            let updatedItems;

            if (existingItemIndex > -1) {
                // Increment quantity
                updatedItems = currentItems.map((orderItem, index) => 
                    index === existingItemIndex 
                    ? { ...orderItem, quantity: orderItem.quantity + 1 }
                    : orderItem
                );
            } else {
                // Add new item
                updatedItems = [...currentItems, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
            }

            const newSubtotal = updatedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

            transaction.update(orderRef, { items: updatedItems, subtotal: newSubtotal });
        });
        
        toast({
            title: `${t('Added')}!`,
            description: `${item.name} ${t('has been added to the order.')}`
        })


    } catch (error) {
        console.error("Error adding item to order:", error);
        toast({ variant: 'destructive', title: t('Error'), description: (error as Error).message || t('Could not add item to order.') });
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
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <h2 className="text-xl font-bold font-headline ml-2">{t('Add to Order')}: {t('Table')} {tableName}</h2>
      </div>

       <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("Search items...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                    className={cn(
                        "cursor-pointer hover:shadow-md hover:border-primary transition-all",
                        clickedItemId === item.id && "animate-pulse scale-105 bg-primary/10"
                    )}
                    onClick={() => handleAddItemToOrder(item)}
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
  );
};

    