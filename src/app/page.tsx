
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TacoIcon } from '@/components/icons/logo';
import { ArrowRight, BarChart, ChefHat, ClipboardList, Package, Utensils, Map as MapIcon, Users, Mail, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { sendContactEmail } from '@/app/actions/contact';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const features = [
  {
    icon: ClipboardList,
    title: 'Gestión de Órdenes Ágil',
    description: 'Toma de pedidos en sitio y para llevar de forma rápida y sin errores, con modificadores avanzados y modo mostrador.',
    color: 'text-yellow-500',
  },
  {
    icon: MapIcon,
    title: 'Mapa Digital de Mesas',
    description: 'Visualiza y gestiona tu restaurante con un mapa interactivo. Asigna mesas y áreas a tu personal en tiempo real.',
    color: 'text-purple-500',
  },
  {
    icon: Utensils,
    title: 'Menú y Recetas Centralizados',
    description: 'Configura tu menú, recetas y costos una sola vez y compártelo instantáneamente con todo tu equipo.',
    color: 'text-red-500',
  },
  {
    icon: Package,
    title: 'Control de Inventario',
    description: 'Mantén tu inventario al día, gestiona proveedores y reduce el desperdicio con nuestro sistema integrado.',
    color: 'text-orange-500',
  },
   {
    icon: BarChart,
    title: 'Reportes con IA',
    description: 'Obtén insights valiosos sobre tus ventas y optimiza tu menú para maximizar la rentabilidad con nuestra IA.',
    color: 'text-green-500',
  },
  {
    icon: Users,
    title: 'Administración de Personal',
    description: 'Define roles, asigna permisos específicos por módulo y gestiona a tu equipo de forma segura y eficiente.',
    color: 'text-teal-500',
  }
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : 'Enviar Mensaje'}
        </Button>
    );
}


export default function LandingPage() {
   const initialState = { message: null, errors: null, success: false };
   const [state, dispatch] = useActionState(sendContactEmail, initialState);
   const { toast } = useToast();
   const formRef = useRef<HTMLFormElement>(null);

   useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state.success) {
      toast({
        title: '¡Mensaje Enviado!',
        description: state.message,
      });
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="#" className="flex items-center gap-2 font-bold">
            <TacoIcon className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl">Tlacualli</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/planes">Planes</Link>
            </Button>            
            <Button className="bg-accent hover:bg-accent/90">
                <Link href="/login">Acceso a Usuarios</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] w-full">
            <Image 
                src="/assets/banner_tlacualli.png" 
                alt="Restaurante" 
                fill
                objectFit="cover"
                quality={85}
                className="brightness-50"
                data-ai-hint="restaurant interior"
            />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight">
                    La <span className="text-primary">gestión</span> de tu restaurante, <br /> elevada a la <span className="text-accent">perfección</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-lg md:text-xl text-white/90 font-body">
                    Tlacualli es la plataforma todo-en-uno que centraliza tus órdenes, mesas, inventario y personal para que te concentres en lo que más importa: crear experiencias inolvidables.
                </p>
                <div className="mt-8 flex gap-4">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold" asChild>
                        <Link href="/planes">
                            Comienza a Crecer (Prueba 15 días)
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>                    
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="container">
                <div className="text-center">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Todo lo que necesitas, en un solo lugar</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground font-body">
                        Desde la toma de pedidos hasta el análisis de rentabilidad, Tlacualli te da el control total de tu operación.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                    {features.map((feature, index) => (
                        <Card key={index} className="bg-card/65 backdrop-blur-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <CardContent className="p-6">
                                <feature.icon className={`h-10 w-10 mb-4 ${feature.color}`} strokeWidth={1.5} />
                                <h3 className="font-headline text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground font-body">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="mt-12 text-center">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 animate-pulse" asChild>
                        <Link href="/guia">
                            ¿Cómo funciona?
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 md:py-24">
            <div className="container">
                <div className="text-center">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Impulsando el éxito de restaurantes como el tuyo</h2>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto">
                     <Card className="bg-card/65 backdrop-blur-lg">
                        <CardContent className="p-8">
                            <blockquote className="text-lg font-body italic text-foreground">
                                “Tlacualli transformó nuestra operación. El mapa de mesas y la gestión de inventario nos han ahorrado horas de trabajo y miles de pesos al mes. Es la herramienta que no sabíamos que necesitábamos.”
                            </blockquote>
                            <footer className="mt-4">
                                <p className="font-headline font-semibold">Ana Torres</p>
                                <p className="text-muted-foreground">Gerente, Sabor Ancestral</p>
                            </footer>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/65 backdrop-blur-lg">
                        <CardContent className="p-8">
                            <blockquote className="font-body italic text-lg text-foreground">
                                “Los reportes con IA son simplemente increíbles. Hemos ajustado nuestro menú basándonos en los datos y vimos un aumento del 20% en la rentabilidad. Totalmente recomendado.”
                            </blockquote>
                            <footer className="mt-4">
                                <p className="font-headline font-semibold">Eduardo Bárcenas</p>
                                <p className="text-muted-foreground">Dueño, El Grill del Compaye</p>
                            </footer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-12 md:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="container max-w-3xl">
                <div className="text-center">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">¿Tienes Preguntas?</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground font-body">
                        Estamos aquí para ayudarte. Envíanos un mensaje y nuestro equipo se pondrá en contacto contigo a la brevedad.
                    </p>
                </div>
                <Card className="mt-12 bg-card/65 backdrop-blur-lg">
                    <CardContent className="p-6">
                        <form ref={formRef} action={dispatch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input id="name" name="name" placeholder="Tu nombre completo" required />
                                    {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" name="email" type="email" placeholder="tu@correo.com" required />
                                    {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Mensaje</Label>
                                <Textarea id="message" name="message" placeholder="Escribe tu duda o comentario aquí..." rows={5} required />
                                {state.errors?.message && <p className="text-sm text-destructive">{state.errors.message[0]}</p>}
                            </div>
                             <SubmitButton />
                        </form>
                    </CardContent>
                </Card>
            </div>
        </section>


        {/* CTA Section */}
        <section className="py-12 md:py-24 bg-gray-900 text-white">
            <div className="container text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">¿Listo para llevar tu restaurante al siguiente nivel?</h2>
                <p className="mt-4 max-w-2xl mx-auto text-white/80 font-body">
                    Únete a los restaurantes que ya están optimizando su gestión con Tlacualli.
                </p>
                <div className="mt-8">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold" asChild>
                       <Link href="/planes">
                            Obtener Acceso Anticipado (Prueba 15 días)
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-6 flex justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Tlacualli. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
                <Link href="/terminos-condiciones" className="hover:text-primary">Términos de Servicio</Link>
                <Link href="/aviso-privacidad" className="hover:text-primary">Aviso de Privacidad</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
