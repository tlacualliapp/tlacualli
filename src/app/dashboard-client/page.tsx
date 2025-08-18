
'use client';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function ClientDashboard() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('Client Dashboard')}</h1>
          <p className="text-muted-foreground">{t('Your personal space.')}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Welcome!')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{t('View your order history, manage your payment methods, and update your profile.')}</p>
          <Button>{t('View My Orders')}</Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
