
"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Globe, Loader2 } from 'lucide-react';
import { TacoIcon } from '@/components/icons/logo';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
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
      // 1. Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Consultar Firestore para verificar el perfil y estado
      const q = query(collection(db, "usuarios"), where("email", "==", user.email), where("status", "==", 1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("El usuario no está activo o no tiene permisos.");
      }

      const userData = querySnapshot.docs[0].data();
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: `¡Bienvenido de vuelta, ${userData.nombre}!`,
      });

      // 3. Redirigir según el perfil
      if (userData.perfil === 'AM') {
        router.push('/dashboard-am');
      } else if (userData.perfil === 1) {
        router.push('/dashboard-admin');
      } else if (userData.perfil === 2) {
        router.push('/dashboard-collaborator');
      } else if (userData.perfil === 3) {
        router.push('/dashboard-client');
      } else {
         throw new Error("Perfil de usuario no reconocido.");
      }

    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      let errorMessage = "Credenciales inválidas o error de conexión. Por favor, intenta de nuevo.";
      if (error instanceof Error && error.message.includes("no está activo")) {
          errorMessage = error.message;
      } else if ((error as any).code === 'auth/user-not-found' || (error as any).code === 'auth/wrong-password' || (error as any).code === 'auth/invalid-credential') {
          errorMessage = "El correo electrónico o la contraseña son incorrectos.";
      }
      
      toast({
        variant: "destructive",
        title: "Inicio de Sesión Fallido",
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
        title: "Correo electrónico requerido",
        description: "Por favor, introduce tu correo electrónico para restablecer la contraseña.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo de recuperación enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
       let errorMessage = "No se pudo enviar el correo de recuperación. Inténtalo de nuevo.";
       if ((error as any).code === 'auth/user-not-found') {
          errorMessage = "No se encontró ningún usuario con ese correo electrónico.";
       }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex items-center justify-center min-h-screen">
       <div 
        className="absolute inset-0 bg-cover bg-center opacity-10" 
        style={{backgroundImage: "url('/assets/background.png')"}}
        data-ai-hint="chef preparing food"
      ></div>
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
                placeholder="Usuario (email)"
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
                type="password"
                placeholder="Contraseña (teléfono)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full focus:ring-red-500"
                autoComplete="current-password"
                required
              />
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                <Label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer">Recordar mi usuario</Label>
              </div>
              <Button variant="link" type="button" onClick={handlePasswordReset} className="text-sm text-red-600 p-0 h-auto">
                ¿Olvidaste tu contraseña?
              </Button>
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full text-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'INICIAR SESIÓN'}
            </Button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-6">www.tlacuallionline.com</p>
        </CardContent>
      </Card>
    </div>
  );
}
