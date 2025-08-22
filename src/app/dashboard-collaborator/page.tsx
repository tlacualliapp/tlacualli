
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function CollaboratorDashboard() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('Collaborator Dashboard')}</h1>
          <p className="text-muted-foreground">{t('Access your daily tasks and information.')}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Welcome, Collaborator!')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('View your assigned orders, tables, and other tasks for the day.')}</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

    