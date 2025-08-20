
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table } from '../map/table-item';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuSelectionProps {
  restaurantId: string;
  table: Table;
  onBack: () => void;
}

export const MenuSelection = ({ restaurantId, table, onBack }: MenuSelectionProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

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

  const handleAddItemToOrder = (item: MenuItem) => {
    // Placeholder for adding item to order logic
    console.log(`Adding ${item.name} to order for table ${table.name}`);
  };

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
        <h2 className="text-xl font-bold font-headline ml-2">{t('Add to Order')}: {t('Table')} {table.name}</h2>
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
                {menuItems.filter(item => item.categoryId === cat.id).map(item => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
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

    