
'use client';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ReportsDashboard } from '@/components/reports/reports-dashboard';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCurrentUserData } from '@/lib/users';


export default function ReportsPage() {
  const [user, loading] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userData = await getCurrentUserData();
        if (userData) {
            setRestaurantId(userData.restauranteId);
            setUserPlan(userData.plan);
        }
        setIsLoading(false);
      } else if (!loading) { // Check if not loading to avoid setting loading to false prematurely
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user, loading]);

  if (loading || isLoading) {
    return (
      <AdminLayout>
         <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {restaurantId && userPlan ? (
        <ReportsDashboard restaurantId={restaurantId} userPlan={userPlan} />
      ) : (
        <p>{t('Restaurant not found or data could not be loaded.')}</p>
      )}
    </AdminLayout>
  );
}
