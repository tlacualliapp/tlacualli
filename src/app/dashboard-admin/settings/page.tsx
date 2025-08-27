
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Loader2, Image as ImageIcon, Percent, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getRestaurantIdForCurrentUser, getCurrentUserData } from '@/lib/users';
import { AdminRestaurantForm } from '@/components/dashboard/admin-restaurant-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  restaurantName: string;
  socialReason: string;
  style: string;
  address: string;
  municipality: string;
  state: string;
  phone: string;
  email: string;
  rfc: string;
  iva?: number;
  logoUrl?: string;
  iconUrl?: string;
  plan?: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iva, setIva] = useState<number | string>('');
  const [isSavingIva, setIsSavingIva] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const storage = getStorage();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (user) {
        setIsLoading(true);
        const userData = await getCurrentUserData();
        if (userData) {
          const id = userData.restauranteId;
          const plan = userData.plan;
          setRestaurantId(id);
          setUserPlan(plan);

          if (id) {
            const collectionName = plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
            const restaurantRef = doc(db, collectionName, id);
            const restaurantSnap = await getDoc(restaurantRef);
            if (restaurantSnap.exists()) {
              const data = { id: restaurantSnap.id, ...restaurantSnap.data() } as Restaurant;
              setRestaurant(data);
              setIva(data.iva || 16); // Default to 16 if not set
            }
          }
        }
        setIsLoading(false);
      }
    };
    fetchRestaurantData();
  }, [user]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'logo' | 'icon') => {
      const file = e.target.files?.[0];
      if (file) {
          if (!file.type.startsWith('image/')) {
              toast({ variant: 'destructive', title: t('Invalid File Type'), description: t('Please select an image file.') });
              return;
          }
          if (file.size > 1024 * 1024) { // 1MB
              toast({ variant: 'destructive', title: t('File too large'), description: t('Please select an image smaller than 1MB.') });
              return;
          }
          if (fileType === 'logo') setLogoFile(file);
          else setIconFile(file);
      }
  };

  const handleImageUpload = async () => {
      if (!logoFile && !iconFile) {
          toast({ variant: 'destructive', title: t('No file selected'), description: t('Please select a file to upload.') });
          return;
      }
      if (!restaurantId || !userPlan) return;

      setIsUploading(true);
      
      try {
          const uploadPromises: Promise<void>[] = [];
          const updateData: { logoUrl?: string, iconUrl?: string } = {};
          const storagePath = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

          if (logoFile) {
              const logoRef = ref(storage, `${storagePath}/${restaurantId}/logos/${logoFile.name}`);
              uploadPromises.push(
                  uploadBytes(logoRef, logoFile).then(snapshot => getDownloadURL(snapshot.ref)).then(url => {
                      updateData.logoUrl = url;
                  })
              );
          }

          if (iconFile) {
              const iconRef = ref(storage, `${storagePath}/${restaurantId}/icons/${iconFile.name}`);
              uploadPromises.push(
                  uploadBytes(iconRef, iconFile).then(snapshot => getDownloadURL(snapshot.ref)).then(url => {
                      updateData.iconUrl = url;
                  })
              );
          }

          await Promise.all(uploadPromises);

          if (Object.keys(updateData).length > 0) {
              const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
              const restaurantRef = doc(db, collectionName, restaurantId);
              await updateDoc(restaurantRef, updateData);
              if (updateData.logoUrl) setRestaurant(prev => prev ? { ...prev, logoUrl: updateData.logoUrl } : null);
              if (updateData.iconUrl) setRestaurant(prev => prev ? { ...prev, iconUrl: updateData.iconUrl } : null);
          }

          toast({ title: t('Upload successful'), description: t('Your images have been updated.') });
          setLogoFile(null);
          setIconFile(null);
      } catch (error) {
          console.error("Error uploading images:", error);
          toast({ variant: 'destructive', title: t('Upload failed'), description: t('An error occurred while uploading your images.') });
      } finally {
          setIsUploading(false);
      }
  };

  const handleSaveIva = async () => {
    if (!restaurantId || !userPlan) return;
    setIsSavingIva(true);
    try {
        const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
        const restaurantRef = doc(db, collectionName, restaurantId);
        await updateDoc(restaurantRef, { iva: Number(iva) });
        toast({ title: t('IVA Updated'), description: t('The new IVA rate has been saved successfully.') });
    } catch (error) {
        console.error("Error updating IVA:", error);
        toast({ variant: 'destructive', title: t('Error'), description: t('Could not save the IVA rate.') });
    } finally {
        setIsSavingIva(false);
    }
  };

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Settings className="h-8 w-8" /> {t('Restaurant Settings')}
          </CardTitle>
          <CardDescription>{t("Manage your restaurant's general information.")}</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : restaurant ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1">
                <Card>
                    <AccordionTrigger className="p-6">
                        <CardHeader className="p-0">
                            <CardTitle className="flex items-center gap-2"><Info className="h-6 w-6"/>{t('Basic Information')}</CardTitle>
                             <CardDescription className="text-left">{t("Update your restaurant's information.")}</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                            <AdminRestaurantForm restaurant={restaurant} />
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>

            <AccordionItem value="item-2">
                <Card>
                    <AccordionTrigger className="p-6">
                        <CardHeader className="p-0">
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-6 w-6"/>{t('Logo & Icon')}</CardTitle>
                            <CardDescription className="text-left">{t('Upload your brand images.')}</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="logo">{t('Logo File (max 1MB)')}</Label>
                                <Input id="logo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                {logoFile && <p className="text-sm text-muted-foreground">{t('Selected')}: {logoFile.name}</p>}
                                {restaurant.logoUrl && !logoFile && <img src={restaurant.logoUrl} alt="Current Logo" className="h-16 mt-2"/>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="icon">{t('Icon File (max 1MB)')}</Label>
                                <Input id="icon" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'icon')}/>
                                {iconFile && <p className="text-sm text-muted-foreground">{t('Selected')}: {iconFile.name}</p>}
                                {restaurant.iconUrl && !iconFile && <img src={restaurant.iconUrl} alt="Current Icon" className="h-16 mt-2"/>}
                            </div>
                            <Button onClick={handleImageUpload} disabled={isUploading}>
                                {isUploading ? <Loader2 className="animate-spin" /> : t('Upload Images')}
                            </Button>
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>

            <AccordionItem value="item-3">
                <Card>
                    <AccordionTrigger className="p-6">
                        <CardHeader className="p-0">
                           <CardTitle className="flex items-center gap-2"><Percent className="h-6 w-6"/>{t('Taxes')}</CardTitle>
                           <CardDescription className="text-left">{t('Configure tax rates.')}</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="iva">{t('IVA Rate (%)')}</Label>
                                <Input 
                                    id="iva" 
                                    type="number" 
                                    value={iva} 
                                    onChange={(e) => setIva(e.target.value)}
                                    placeholder="16"
                                />
                            </div>
                            <Button onClick={handleSaveIva} disabled={isSavingIva}>
                                {isSavingIva ? <Loader2 className="animate-spin" /> : t('Save IVA Rate')}
                            </Button>
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>
        </Accordion>
      ) : (
        <p>{t('Restaurant data could not be loaded.')}</p>
      )}
    </AdminLayout>
  );
}
