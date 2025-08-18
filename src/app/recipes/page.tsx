
'use client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { RecipesTable } from '@/components/recipes/recipes-table';
import { BookOpen } from 'lucide-react';


export default function RecipesPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

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

  return (
    <AdminLayout>
       <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <BookOpen className="h-8 w-8" /> {t('Recipe Management')}
            </CardTitle>
            <CardDescription>{t('Create, edit, and scale your recipes with precision.')}</CardDescription>
        </CardHeader>
      </Card>
      
      <Card className="bg-card/65 backdrop-blur-lg">
        <CardContent className="p-4 md:p-6">
            {restaurantId ? <RecipesTable restaurantId={restaurantId} /> : <p>{t('Loading...')}</p>}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
