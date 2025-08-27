
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Users,
  Package,
  ClipboardList,
  ChefHat,
  BarChart,
  Map,
  Utensils,
  Settings,
  Loader2,
  BookOpen,
  ArrowRight,
  QrCode,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import Image from 'next/image';
import { InvoiceIcon } from '@/components/icons/invoice';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const qrCodeRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
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

  const modules = [
    { href: '/orders', icon: ClipboardList, label: 'Orders', color: 'bg-yellow-500' },
    { href: '/dashboard-admin/menu', icon: Utensils, label: 'Menu & Recipes', color: 'bg-red-500' },
    { href: '/dashboard-admin/employees', icon: Users, label: 'Staff', color: 'bg-teal-500' },
    { href: '/dashboard-admin/inventory', icon: Package, label: 'Inventory', color: 'bg-orange-500' },
    { href: '/kitchen', icon: ChefHat, label: 'Kitchen', color: 'bg-gray-500' },
    { href: '/dashboard-admin/reports', icon: BarChart, label: 'Reports', color: 'bg-green-500' },
    { href: '/dashboard-admin/map', icon: Map, label: 'Digital Map', color: 'bg-purple-500' },
    { href: `/menu-read?restaurantId=${restaurantId}`, icon: BookOpen, label: 'Menu Clientes', color: 'bg-pink-500' },
    { href: '/dashboard-admin/billing', icon: InvoiceIcon, label: 'Billing', color: 'bg-indigo-500' },
    { href: '/dashboard-admin/settings', icon: Settings, label: 'Settings', color: 'bg-slate-600' },
  ];
  
  const handleGenerateQR = async () => {
    if (!restaurantId) return;
    const url = `${window.location.origin}/menu-read?restaurantId=${restaurantId}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintQR = () => {
    if (qrCodeDataUrl && qrCodeRef.current) {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
            <html>
                <head><title>${t('Print QR Code')}</title></head>
                <body style="text-align: center; margin-top: 50px;">
                    <img src="${qrCodeDataUrl}" alt="Menu QR Code" />
                    <p>${t('Scan this code to view the menu.')}</p>
                </body>
            </html>
        `);
        printWindow?.document.close();
        printWindow?.print();
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `menu-qr-${restaurantId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

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
          <CardTitle className="text-3xl font-bold font-headline">{t('Administrator Dashboard')}</CardTitle>
          <p className="text-muted-foreground">{t("Manage your restaurant's operations.")}</p>
        </CardHeader>
      </Card>
      <Card className="bg-card/65 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('Modules')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {modules.map((item) => {
              if (item.label === 'Menu Clientes') {
                return (
                  <Dialog key={item.href} open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
                    <DialogTrigger asChild disabled={!restaurantId}>
                      <Card className={`hover:scale-105 transition-transform duration-200 ease-in-out group ${item.color} text-white overflow-hidden cursor-pointer`}>
                          <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                  <span>{t(item.label)}</span>
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="flex items-center justify-center p-6">
                              <item.icon className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-200 ease-in-out" strokeWidth={1.5}/>
                          </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('Menu Options')}</DialogTitle>
                        <DialogDescription>{t('Choose an action for the customer menu.')}</DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <Button className="w-full" onClick={() => router.push(item.href)}>
                          <ArrowRight className="mr-2" /> {t('Go to Menu')}
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleGenerateQR}>
                          <QrCode className="mr-2" /> {t('Generate QR Code')}
                        </Button>
                        {qrCodeDataUrl && (
                          <div ref={qrCodeRef} className="text-center p-4 border rounded-md">
                            <Image src={qrCodeDataUrl} alt="Menu QR Code" width={300} height={300} className="mx-auto"/>
                            <p className="text-sm text-muted-foreground mt-2">{t('Scan this code to view the menu.')}</p>
                            <div className="flex justify-center gap-2 mt-4">
                               <Button size="sm" variant="outline" onClick={handleDownloadQR}><Download className="mr-2" />{t('Download')}</Button>
                               <Button size="sm" variant="outline" onClick={handlePrintQR}><Printer className="mr-2" />{t('Print')}</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              }
              return (
                <Link href={item.href} key={item.href} className={!restaurantId && item.label === 'Menu Clientes' ? 'pointer-events-none' : ''}>
                    <Card className={`hover:scale-105 transition-transform duration-200 ease-in-out group ${item.color} text-white overflow-hidden`}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{t(item.label)}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-6">
                            <item.icon className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-200 ease-in-out" strokeWidth={1.5}/>
                        </CardContent>
                    </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
