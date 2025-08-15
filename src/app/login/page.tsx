
"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Globe } from 'lucide-react';
import { TacoIcon } from '@/components/icons/logo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "¡Bienvenido de vuelta!",
      });
      router.push('/dashboard-am');
    } else {
      toast({
        variant: "destructive",
        title: "Inicio de Sesión Fallido",
        description: "Credenciales inválidas. Por favor, intenta de nuevo.",
      });
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
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full focus:ring-red-500"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/50 border-gray-300 placeholder:text-gray-500 rounded-full focus:ring-red-500"
                autoComplete="current-password"
              />
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full text-lg">
              INICIAR SESIÓN
            </Button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-6">www.tlacuallionline.com</p>
        </CardContent>
      </Card>
    </div>
  );
}
