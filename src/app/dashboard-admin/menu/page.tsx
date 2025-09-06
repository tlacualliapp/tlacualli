
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, Utensils, List, Loader2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { RecipesTable } from '@/components/recipes/recipes-table';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import { MenuTable } from '@/components/menu/menu-table';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { getCurrentUserData } from '@/lib/users';
import { RecipeSuggester } from '@/components/recipes/recipe-suggester';

interface Recipe {
  id: string;
  name: string;
  cost: number;
  ingredients: any[];
}

type UserPlan = "demo" | "esencial" | "pro" | "ilimitado";

export default function MenuPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const { t } = useTranslation();
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userData = await getCurrentUserData();
        if (userData) {
          setRestaurantId(userData.restauranteId);
          setUserPlan(userData.plan as UserPlan);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!restaurantId || !userPlan) return;
    const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
    const q = query(collection(db, `${collectionName}/${restaurantId}/recipes`));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(recipesData);
    });

    return () => unsubscribe();
  }, [restaurantId, userPlan]);

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  if (!restaurantId || !userPlan) {
    return <AdminLayout><div>{t('Loading...')}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <Utensils className="h-8 w-8" /> {t('Menu & Recipes')}
            </CardTitle>
            <CardDescription>{t('Manage your recipes and menu items.')}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <RecipeForm restaurantId={restaurantId} userPlan={userPlan} existingRecipes={recipes} onSuccess={() => setIsRecipeModalOpen(false)} />
            </DialogContent>
        </Dialog>

        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="text-accent"/>{t('AI Inspiration')}</CardTitle>
                <CardDescription>{t('Generate recipe ideas based on your inventory.')}</CardDescription>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
                <RecipeSuggester restaurantId={restaurantId} userPlan={userPlan} />
            </CardContent>
        </Card>
        
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
             <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('Create Menu Item')}</DialogTitle>
                    <DialogDescription>{t('Add a new dish to your menu, linking it to a recipe.')}</DialogDescription>
                </DialogHeader>
                <MenuItemForm restaurantId={restaurantId} userPlan={userPlan} onSuccess={() => setIsMenuItemModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><List />{t('Existing Recipes')}</CardTitle>
                   <CardDescription>{t('View and manage your current recipes.')}</CardDescription>
              </CardHeader>
              <CardContent>
                  <RecipesTable restaurantId={restaurantId} userPlan={userPlan} recipes={recipes} />
              </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><List />{t('Menu Items')}</CardTitle>
                  <CardDescription>{t('View and manage your current menu dishes.')}</CardDescription>
              </CardHeader>
              <CardContent>
                  <MenuTable restaurantId={restaurantId} userPlan={userPlan} />
              </CardContent>
          </Card>
        </div>
      </div>

    </AdminLayout>
  );
}
