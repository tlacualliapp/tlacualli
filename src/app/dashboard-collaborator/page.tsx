
'use client';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function CollaboratorDashboard() {
  const { t } = useTranslation();
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
