
'use client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ReportsDashboard } from '@/components/reports/reports-dashboard';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function ReportsPage() {
  const [user] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setRestaurantId(userData.restauranteId);
        }
        setIsLoading(false);
      } else if (!user && !isLoading) {
        setIsLoading(false);
      }
    };
    fetchRestaurantId();
  }, [user, isLoading]);

  return (
    <AdminLayout>
      {isLoading ? (
         <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : restaurantId ? (
        <ReportsDashboard restaurantId={restaurantId} />
      ) : (
        <p>{t('Restaurant not found.')}</p>
      )}
    </AdminLayout>
  );
}
