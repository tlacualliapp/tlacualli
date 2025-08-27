
"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { TacoIcon } from '@/components/icons/logo';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoModalContent, setDemoModalContent] = useState({ title: '', description: '', isTrialEnded: false });


  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
    // Ensure user is logged out when visiting the login page
    signOut(auth);
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Query Firestore to check user profile and status
      const q = query(
        collection(db, "usuarios"), 
        where("email", "==", user.email),
        where("status", "==", "1") // status as string
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(t("The user is not active or does not have permissions."));
      }

      const userData = querySnapshot.docs[0].data();
      const restaurantId = userData.restauranteId;
      const userPlan = userData.plan;
      let restaurantName = 'N/A';
      
      // 3. If user belongs to a restaurant, check restaurant status
      if (restaurantId) {
        const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
        const restaurantRef = doc(db, collectionName, restaurantId);
        const restaurantSnap = await getDoc(restaurantRef);

        if (restaurantSnap.exists()) {
            const restaurantData = restaurantSnap.data();
            restaurantName = restaurantData.restaurantName || 'Desconocido';
            if (restaurantData.status !== "1") {
                 throw new Error(t("The restaurant this user belongs to is not active."));
            }

            if (userPlan === 'demo') {
                const registrationDate = restaurantData.fecharegistro?.toDate();
                if(registrationDate) {
                    const daysElapsed = differenceInDays(new Date(), registrationDate);
                    if (daysElapsed > 15) {
                        setDemoModalContent({
                            title: t('Periodo de Prueba Finalizado'),
                            description: t('Tu periodo de prueba de 15 días ha expirado. Por favor, elige un plan para continuar usando Tlacualli.'),
                            isTrialEnded: true,
                        });
                    } else {
                        const daysLeft = 15 - daysElapsed;
                        setDemoModalContent({
                            title: t('¡Bienvenido a tu Demo!'),
                            description: t('Te quedan {{count}} días de tu prueba gratuita. ¡Disfrútalos!', { count: daysLeft }),
                            isTrialEnded: false,
                        });
                    }
                    setIsDemoModalOpen(true);
                    return; // Stop execution here, let the modal handle redirection
                }
            }


        } else {
            throw new Error(t("The associated restaurant could not be found."));
        }
      }


      // 4. Log to Monitor
       await addDoc(collection(db, "monitor"), {
            accion: "Inicio de sesion",
            usuarioNombre: `${userData.nombre} ${userData.apellidos}`,
            usuarioPerfil: userData.perfil,
            restauranteId: restaurantId || null,
            restauranteNombre: restaurantName,
            fecha: serverTimestamp(),
        });
      
      toast({
        title: t("Login Successful"),
        description: t("Welcome back, {{name}}!", { name: userData.nombre }),
      });

      // 5. Redirect based on profile
      if (userData.perfil === 'AM') {
        router.push('/dashboard-am');
      } else if (userData.perfil === 1 || userData.perfil === '1') {
        router.push('/dashboard-admin');
      } else if (userData.perfil === 2 || userData.perfil === '2') {
        router.push('/dashboard-collaborator');
      } else if (userData.perfil === 3 || userData.perfil === '3') {
        router.push('/dashboard-client');
      } else {
         throw new Error(t("Unrecognized user profile or invalid status."));
      }

    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      let errorMessage = t("Invalid credentials or connection error. Please try again.");
      const errorCode = (error as any).code;

      if (errorCode === 'auth/invalid-credential') {
          errorMessage = t("The email or password are incorrect.");
      } else if (error instanceof Error) {
          // Handle custom errors thrown in the try block
          if (error.message.includes("not active") || error.message.includes("unrecognized") || error.message.includes("could not be found")) {
            errorMessage = error.message;
          }
      }
      
      toast({
        variant: "destructive",
        title: t("Login Failed"),
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: t("Email required"),
        description: t("Please enter your email to reset your password."),
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: t("Recovery email sent"),
        description: t("Check your inbox to reset your password."),
      });
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
       let errorMessage = t("Could not send recovery email. Please try again.");
       if ((error as any).code === 'auth/user-not-found') {
          errorMessage = t("No user found with that email address.");
       }
      toast({
        variant: "destructive",
        title: t("Error"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalAction = () => {
    setIsDemoModalOpen(false);
    if (demoModalContent.isTrialEnded) {
        router.push('/planes');
    } else {
        // Find the profile and redirect
        const user = auth.currentUser;
        if(user) {
            getDocs(query(collection(db, "usuarios"), where("uid", "==", user.uid))).then(snap => {
                if(!snap.empty) {
                    const userData = snap.docs[0].data();
                     if (userData.perfil === '1') {
                        router.push('/dashboard-admin');
                    } else {
                        // Add other profiles if needed, or a default
                        router.push('/login'); 
                    }
                }
            });
        }
    }
  };


  return (
    <>
    <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
            <DialogTitle>{demoModalContent.title}</DialogTitle>
            <DialogDescription>{demoModalContent.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
            <Button onClick={handleModalAction}>
                {demoModalContent.isTrialEnded ? t('Ver Planes') : t('Continuar al Dashboard')}
            </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <div 
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <Card className="w-full max-w-sm bg-white/50 backdrop-blur-lg border-white/20 text-gray-800 rounded-2xl z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <TacoIcon className="h-24 w-24 text-red-600" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-wider text-gray-900">TLACUALLI</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="email"
                placeholder={t('User (email)')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full focus:ring-red-500"
                autoComplete="email"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full focus:ring-red-500"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                aria-label={t(showPassword ? 'Hide password' : 'Show password')}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                <Label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer">{t('Remember me')}</Label>
              </div>
              <Button variant="link" type="button" onClick={handlePasswordReset} className="text-sm text-red-600 p-0 h-auto">
                {t('Forgot your password?')}
              </Button>
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full text-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : t('LOG IN')}
            </Button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-6">www.tlacuallionline.com</p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
