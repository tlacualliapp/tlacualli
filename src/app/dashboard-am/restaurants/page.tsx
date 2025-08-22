'use client';
import React, { useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UtensilsCrossed, LogIn, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RestaurantForm } from '@/components/dashboard/restaurant-form';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { TacoIcon } from '@/components/icons/logo';

export default function CreateRestaurantPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    // If there is no user and we are not loading, set language to Spanish
    if (!loading && !user) {
        i18n.changeLanguage('es');
    }
  }, [user, loading, i18n]);

  const renderContent = () => (
    <>
      <Card className="mb-6 bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
              <UtensilsCrossed className="h-8 w-8" /> {t('Register Restaurant')}
            </CardTitle>
            <CardDescription className="text-gray-600">{t('Add a new restaurant and its administrator to the system.')}</CardDescription>
          </div>
          {user && (
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('Go Back')}
            </Button>
          )}
        </CardHeader>
      </Card>
      
      <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
        <CardHeader>
          <CardTitle>{t('Restaurant Information')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantForm onSuccess={() => router.push(user ? '/dashboard-am' : '/login')} />
        </CardContent>
      </Card>
    </>
  );

  if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
  }

  // If user is authenticated, render with the app layout
  if (user) {
      return <AppLayout>{renderContent()}</AppLayout>;
  }

  // If no user, render the public registration page
  return (
    <div 
        className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center p-4 sm:p-6 md:p-8"
        style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10 w-full max-w-4xl space-y-6">
        <header className="text-center text-white">
             <div className="flex justify-center mb-4">
                <TacoIcon className="h-24 w-24 text-primary" />
              </div>
              <h1 className="font-headline text-4xl font-bold tracking-wider text-white">TLACUALLI</h1>
              <p className="text-white/80 mt-2">{t('The first step to elevate your restaurant')}</p>
              <div className="mt-4">
                <Button variant="link" asChild className="text-white/90">
                  <Link href="/login"><LogIn className="mr-2"/>{t('Already have an account? Log in')}</Link>
                </Button>
              </div>
        </header>
        {renderContent()}
      </div>
    </div>
  );
}
