
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TacoIcon } from '@/components/icons/logo';
import { ArrowRight, CheckCircle, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const plans = [
  {
    name: 'Plan Esencial',
    price: '$195 MXN/mes',
    description: 'Ideal para cafeterías, food trucks o restaurantes pequeños.',
    features: [
      'Gestión de hasta 6 mesas.',
      'Control de hasta 500 órdenes mensuales.',
      'Control de inventarios, recetas y menús.',
      'Soporte técnico por chat.',
    ],
    cta: 'Empezar con Esencial',
    salesText: 'El plan perfecto para empezar a digitalizar tu negocio. Gestiona tus mesas y pedidos con precisión, lleva un control de tus recetas e inventarios y olvídate de las libretas. Por menos de lo que cuesta un café al día, obtén la herramienta que necesitas para organizar tu operación.',
  },
  {
    name: 'Plan Pro',
    price: '$295 MXN/mes',
    description: 'Perfecto para restaurantes familiares o negocios con alta demanda.',
    features: [
      'Gestión de hasta 15 mesas.',
      'Control de hasta 2,000 órdenes mensuales.',
      'Todas las funcionalidades del plan Esencial.',
      'Soporte prioritario.',
    ],
    cta: 'Elegir Plan Pro',
    isPopular: true,
    salesText: 'Este plan es el socio ideal para negocios que no paran de crecer. Acelera tus procesos, atiende a más clientes y mantén el control de tus ventas con una capacidad superior. Maximiza tu rentabilidad y gestiona picos de demanda con una herramienta que se adapta a tu ritmo.',
  },
  {
    name: 'Plan Ilimitado',
    price: '$595 MXN/mes',
    description: 'Para restaurantes con gran afluencia, franquicias o múltiples ubicaciones.',
    features: [
      'Gestión de hasta 25 mesas.',
      'Control de hasta 5,000 órdenes mensuales.',
      'Todas las funcionalidades de los planes anteriores.',
      'Soporte dedicado y consultoría.',
    ],
    cta: 'Contactar para Ilimitado',
    salesText: 'Diseñado para los líderes de la industria. Si tu negocio tiene un alto volumen de ventas y necesitas un control total, el Plan Ilimitado es para ti. Con esta capacidad, podrás gestionar cada mesa y cada orden sin preocuparte por los límites. La solución completa para tu éxito a gran escala.',
  },
];

const comparisonFeatures = [
    { name: 'Mesas', values: ['Hasta 6', 'Hasta 15', 'Hasta 25'] },
    { name: 'Órdenes mensuales', values: ['Hasta 500', 'Hasta 2,000', 'Hasta 5,000'] },
    { name: 'Gestión de inventarios', values: ['✔️', '✔️', '✔️'] },
    { name: 'Gestión de recetas y menús', values: ['✔️', '✔️', '✔️'] },
    { name: 'Soporte técnico', values: ['✔️', '✔️', '✔️'] },
];

const faqs = [
    {
        question: '¿Cómo funcionan los 15 días de prueba gratuita?',
        answer: 'Simplemente regístrate y tendrás acceso a todas las funcionalidades del Plan Pro durante 15 días, sin necesidad de ingresar una tarjeta de crédito. Al finalizar el periodo, podrás elegir el plan que mejor se adapte a ti.'
    },
    {
        question: '¿Puedo cambiar de plan en cualquier momento?',
        answer: '¡Sí! Puedes cambiar de plan, ya sea para ampliar o reducir tus servicios, en cualquier momento desde el panel de configuración de tu cuenta. El cambio se aplicará en tu siguiente ciclo de facturación.'
    },
    {
        question: '¿Los precios mostrados incluyen el IVA?',
        answer: 'Los precios mostrados son más IVA. El impuesto se desglosará en tu factura al momento del pago.'
    },
    {
        question: '¿Qué formas de pago aceptan?',
        answer: 'Aceptamos las principales tarjetas de crédito y débito. Todo el proceso de pago es seguro y está encriptado.'
    },
     {
        question: '¿Hay algún contrato forzoso?',
        answer: 'No. En Tlacualli App creemos en la flexibilidad. Puedes cancelar tu suscripción en cualquier momento, sin penalizaciones ni contratos a largo plazo.'
    }
]

export default function PricingPage() {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <TacoIcon className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl">Tlacualli</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">            
            <Button className="bg-accent hover:bg-accent/90">
                <Link href="/login">{t('Acceso a Usuarios')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] w-full">
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
                    {t('Elige el plan que hará')} <span className="text-primary">{t('crecer')}</span> {t('tu negocio')}
                </h1>
                <p className="mt-6 max-w-3xl text-lg md:text-xl text-white/90 font-body">
                    {t('En Tlacualli App, creemos que la tecnología debe ser accesible para todos. Por eso, hemos diseñado planes que se adaptan perfectamente al tamaño de tu restaurante, ayudándote a gestionar tu negocio de manera eficiente, sin complicaciones y a un precio justo.')}
                </p>
            </div>
        </section>

        {/* Free Trial Section */}
        <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-900/50">
            <div className="container text-center">
                 <h2 className="font-headline text-3xl md:text-4xl font-bold">{t('Regístrate y prueba Tlacualli App gratis por 15 días')}</h2>
                 <p className="mt-4 max-w-3xl mx-auto text-muted-foreground font-body">
                    {t('¿Aún no estás seguro? No te preocupes. Te invitamos a probar todas las funcionalidades de Tlacualli App sin costo. Sin tarjeta de crédito ni compromisos. Explora cómo nuestra herramienta puede transformar la gestión de tu restaurante y descubre por qué miles de negocios confían en nosotros.')}
                 </p>
                 <Button size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground font-bold" asChild>
                    <Link href="/register">
                       {t('¡Empieza tu prueba gratuita ahora!')}
                       <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                 </Button>
            </div>
        </section>


        {/* Pricing Plans Section */}
        <section id="plans" className="py-12 md:py-24">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <Card key={index} className={`flex flex-col ${plan.isPopular ? 'border-primary border-2 shadow-lg' : ''}`}>
                            {plan.isPopular && <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1 rounded-t-lg">{t('Más Popular')}</div>}
                            <CardHeader className="text-center">
                                <CardTitle className="font-headline text-3xl">{t(plan.name)}</CardTitle>
                                <p className="text-muted-foreground pt-2">{t(plan.description)}</p>
                                <p className="text-4xl font-bold font-headline pt-4">{t(plan.price).split(' ')[0]} <span className="text-lg font-normal text-muted-foreground">{t(plan.price).split(' ').slice(1).join(' ')}</span></p>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                                <div>
                                    <p className="text-sm font-body mb-6">{t(plan.salesText)}</p>
                                    <ul className="space-y-3 font-body text-sm mb-6">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span>{t(feature)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <Button className="w-full mt-auto" asChild variant={plan.isPopular ? 'default' : 'outline'}>
                                    <Link href="/register">{t(plan.cta)}</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Comparison Table */}
        <section className="py-12 md:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="container">
                 <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">{t('Compara nuestros planes')}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground font-body">{t('Encuentra la solución perfecta para tu restaurante.')}</p>
                </div>
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/4 font-headline text-lg pl-6">{t('Funcionalidad')}</TableHead>
                                {plans.map(plan => <TableHead key={plan.name} className="text-center font-headline text-lg">{t(plan.name)}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparisonFeatures.map(feature => (
                                <TableRow key={feature.name}>
                                    <TableCell className="font-semibold pl-6">{t(feature.name)}</TableCell>
                                    {feature.values.map((value, index) => (
                                        <TableCell key={index} className="text-center">{t(value)}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell className="font-bold pl-6">{t('Precio mensual (+IVA)')}</TableCell>
                                {plans.map(plan => (
                                    <TableCell key={plan.name} className="text-center font-bold text-lg text-primary">
                                        {t(plan.price).split(' ')[0]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </section>

        {/* Added Value & FAQ Section */}
         <section className="py-12 md:py-24">
            <div className="container">
                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    <div>
                         <h2 className="font-headline text-3xl font-bold mb-4">{t('¿Por qué elegir Tlacualli?')}</h2>
                         <div className="space-y-6">
                            <Card className="bg-card/65 backdrop-blur-lg">
                                <CardContent className="p-6">
                                    <h3 className="font-headline text-xl font-semibold mb-2">{t('Precios sin competencia')}</h3>
                                    <p className="text-muted-foreground font-body">{t('Ofrecemos las tarifas más competitivas del mercado, dándote acceso a tecnología de punta sin sacrificar tu presupuesto.')}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/65 backdrop-blur-lg">
                                <CardContent className="p-6">
                                    <h3 className="font-headline text-xl font-semibold mb-2">{t('Fácil de usar')}</h3>
                                    <p className="text-muted-foreground font-body">{t('Nuestra interfaz es tan intuitiva que no necesitarás capacitación técnica. Empieza a gestionar tu restaurante en minutos.')}</p>
                                </CardContent>
                            </Card>
                             <Card className="bg-card/65 backdrop-blur-lg">
                                <CardContent className="p-6">
                                    <h3 className="font-headline text-xl font-semibold mb-2">{t('Sin contratos forzosos')}</h3>
                                    <p className="text-muted-foreground font-body">{t('Tu libertad es importante. Por eso, puedes cancelar tu suscripción en cualquier momento, sin preguntas ni penalizaciones.')}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-headline text-3xl font-bold mb-4 flex items-center gap-2"><HelpCircle/> {t('Preguntas Frecuentes')}</h2>
                         <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, i) => (
                               <AccordionItem key={i} value={`item-${i}`}>
                                 <AccordionTrigger className="font-semibold text-left">{t(faq.question)}</AccordionTrigger>
                                 <AccordionContent className="text-muted-foreground">
                                   {t(faq.answer)}
                                 </AccordionContent>
                               </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>


      </main>

      {/* Footer */}
      {isClient && (
        <footer className="border-t">
            <div className="container py-6 flex justify-between items-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Tlacualli. {t('All rights reserved.')}</p>
                <div className="flex items-center gap-4">
                    <Link href="/terminos-condiciones" className="hover:text-primary">{t('Terms of Service')}</Link>
                    <Link href="/aviso-privacidad" className="hover:text-primary">{t('Privacy Policy')}</Link>
                </div>
            </div>
        </footer>
      )}
    </div>
  );
}
