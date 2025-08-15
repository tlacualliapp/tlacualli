
"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Lock, Globe } from 'lucide-react';
import { TacoIcon } from '@/components/icons/logo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
      });
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-yellow-500">
       <div 
        className="absolute inset-0 bg-cover bg-center opacity-20" 
        style={{backgroundImage: "url('https://placehold.co/1080x1920.png')"}}
        data-ai-hint="spices in bowl"
      ></div>
      <Card className="w-full max-w-sm bg-white/10 backdrop-blur-lg border-white/20 text-white rounded-2xl z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <TacoIcon className="h-24 w-24" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-wider">TLACUALLI</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 placeholder:text-white/70 rounded-full focus:ring-white"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                type="text"
                placeholder="Restaurant Name"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 placeholder:text-white/70 rounded-full focus:ring-white"
                autoComplete="off"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/20 border-white/30 placeholder:text-white/70 rounded-full focus:ring-white"
                autoComplete="current-password"
              />
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full text-lg">
              LOG IN
            </Button>
          </form>
          <p className="text-center text-xs text-white/60 mt-6">www.tlacuallionline.com</p>
        </CardContent>
      </Card>
    </div>
  );
}
