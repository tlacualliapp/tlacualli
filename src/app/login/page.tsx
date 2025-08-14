"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid PIN. Please try again.",
      });
      setPin('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-16 w-16 text-primary" fill="currentColor" />
          </div>
          <CardTitle className="font-headline text-2xl">Welcome to Tlacualli</CardTitle>
          <CardDescription>Enter your PIN to access the system</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-10 text-center tracking-[0.5em] text-lg"
                maxLength={4}
                autoComplete="off"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
              Unlock
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
