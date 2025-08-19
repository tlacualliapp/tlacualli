
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, Utensils, List } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { RecipesTable } from '@/components/recipes/recipes-table';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import { MenuTable } from '@/components/menu/menu-table';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function MenuPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { t } = useTranslation();
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        }
      }
    };
    fetchRestaurantId();
  }, [user]);

  if (!restaurantId) {
    return <AdminLayout><div>{t('Loading...')}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">{t('Menu & Recipes')}</CardTitle>
            <CardDescription>{t('Manage your recipes and menu items.')}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Create Recipe Card */}
        <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen className="text-primary"/>{t('Create Recipe')}</CardTitle>
                    <CardDescription>{t('Add a new technical sheet for a dish.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <DialogTrigger asChild>
                        <Button className="w-full"><PlusCircle className="mr-2"/>{t('Create')}</Button>
                    </DialogTrigger>
                </CardContent>
            </Card>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{t('Create New Recipe')}</DialogTitle>
                    <DialogDescription>{t('Define the ingredients and cost for a new dish.')}</DialogDescription>
                </DialogHeader>
                <RecipeForm restaurantId={restaurantId} onSuccess={() => setIsRecipeModalOpen(false)} t={t} />
            </DialogContent>
        </Dialog>
        
        {/* Create Menu Item Card */}
        <Dialog open={isMenuItemModalOpen} onOpenChange={setIsMenuItemModalOpen}>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/>{t('Create Menu Item')}</CardTitle>
                    <CardDescription>{t('Add a new dish to your public menu.')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <DialogTrigger asChild>
                        <Button className="w-full"><PlusCircle className="mr-2"/>{t('Create')}</Button>
                    </DialogTrigger>
                </CardContent>
            </Card>
             <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('Create Menu Item')}</DialogTitle>
                    <DialogDescription>{t('Add a new dish to your menu, linking it to a recipe.')}</DialogDescription>
                </DialogHeader>
                <MenuItemForm restaurantId={restaurantId} onSuccess={() => setIsMenuItemModalOpen(false)} t={t} />
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Recipes Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><List />{t('Existing Recipes')}</CardTitle>
                 <CardDescription>{t('View and manage your current recipes.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <RecipesTable restaurantId={restaurantId} t={t} />
            </CardContent>
        </Card>

        {/* Menu Items Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><List />{t('Menu Items')}</CardTitle>
                <CardDescription>{t('View and manage your current menu dishes.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <MenuTable restaurantId={restaurantId} t={t} />
            </CardContent>
        </Card>
      </div>

    </AdminLayout>
  );
}
