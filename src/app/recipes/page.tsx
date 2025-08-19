
'use client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { RecipesTable } from '@/components/recipes/recipes-table';
import { BookOpen, Utensils } from 'lucide-react';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import { MenuTable } from '@/components/menu/menu-table';


export default function RecipesPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [key, setKey] = useState(0); // Key to force re-render of forms

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

  const handleSuccess = () => {
    setKey(prevKey => prevKey + 1); // Change key to trigger re-render
  };


  return (
    <AdminLayout>
       <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <Utensils className="h-8 w-8" /> {t('Menu and Recipe Management')}
            </CardTitle>
            <CardDescription>{t('Create recipes, calculate costs, and build your menu.')}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recipes Section */}
        <Card className="bg-card/65 backdrop-blur-lg">
            <CardHeader>
                <CardTitle>{t('Create Recipe (Technical Sheet)')}</CardTitle>
            </CardHeader>
            <CardContent>
                 {restaurantId ? <RecipeForm key={`recipe-form-${key}`} restaurantId={restaurantId} onSuccess={handleSuccess} /> : <p>{t('Loading...')}</p>}
            </CardContent>
        </Card>

        <Card className="bg-card/65 backdrop-blur-lg">
            <CardHeader>
                <CardTitle>{t('Existing Recipes')}</CardTitle>
            </CardHeader>
            <CardContent>
                {restaurantId ? <RecipesTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
            </CardContent>
        </Card>

        {/* Menu Items Section */}
        <Card className="bg-card/65 backdrop-blur-lg">
            <CardHeader>
                <CardTitle>{t('Create Menu Item')}</CardTitle>
            </CardHeader>
            <CardContent>
                {restaurantId ? <MenuItemForm key={`menu-item-form-${key}`} restaurantId={restaurantId} onSuccess={handleSuccess} /> : <p>{t('Loading...')}</p>}
            </CardContent>
        </Card>
        
        <Card className="bg-card/65 backdrop-blur-lg">
             <CardHeader>
                <CardTitle>{t('Menu Items')}</CardTitle>
            </CardHeader>
            <CardContent>
                {restaurantId ? <MenuTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
            </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
