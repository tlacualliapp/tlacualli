
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { RestaurantForm } from '@/components/dashboard/restaurant-form';
import { useTranslation } from 'react-i18next';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { TacoIcon } from '@/components/icons/logo';
import '@/app/i18n';

export default function RegisterPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    // If the user is already logged in, redirect them to their dashboard
    if (!loading && user) {
        // You might want to add more specific logic here based on user profile
        router.push('/dashboard-am'); 
    } else {
        // Default to Spanish for non-logged-in users
        i18n.changeLanguage('es');
    }
  }, [user, loading, router, i18n]);

  return (
    <div 
        className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center p-4 sm:p-6 md:p-8"
        style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10 w-full max-w-4xl space-y-6">
        <header className="flex justify-center mb-4">
             <TacoIcon className="h-24 w-24 text-primary" />
        </header>
        
        <Card className="bg-white/50 backdrop-blur-lg border-white/20 text-gray-800">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">{t('Register Your Restaurant')}</CardTitle>
                 <CardDescription className="text-gray-600">{t('Take the first step to elevate your restaurant.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <RestaurantForm onSuccess={() => router.push('/login')} source="register" />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
