
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TacoIcon } from '@/components/icons/logo';
import { ArrowLeft, Package, Utensils, BookOpen, Users, Map as MapIcon, ClipboardList, Truck, BarChart, QrCode } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const steps = [
    {
        icon: Package,
        title: 'Paso 1: Controla tu Universo de Inventario',
        description: 'Antes de crear cualquier obra maestra culinaria, necesitas los ingredientes. Registra todos tus insumos y productos en tu inventario. Desde el pan para hamburguesas (¡en piezas, por supuesto!) hasta las botellas de refresco, asegúrate de que cada artículo tenga la unidad de medida correcta para un control de stock infalible. Un inventario exacto es el primer paso para una gestión sin sorpresas.',
        color: 'text-orange-500',
    },
    {
        icon: Utensils,
        title: 'Paso 2: Dale vida a tus Recetas',
        description: 'Ahora, es momento de la magia. Para cada platillo, registra la receta con las cantidades exactas de sus ingredientes. La precisión es clave: nuestra plataforma usará esta información para descontar dinámicamente cada ingrediente del inventario cada vez que se registre una orden. De esta manera, tu stock se actualiza en tiempo real, sin esfuerzo.',
        color: 'text-red-500',
    },
    {
        icon: BookOpen,
        title: 'Paso 3: Crea tu Menú en un instante',
        description: 'Organiza tu oferta culinaria de manera profesional. Crea categorías como "Carnes", "Pescados" o "Bebidas" y asigna las recetas correspondientes a cada platillo. También puedes incluir productos directos del inventario que no requieran preparación. Con unos clics, tu menú estará listo para brillar.',
        color: 'text-blue-500',
    },
    {
        icon: Users,
        title: 'Paso 4: Empodera a tu Equipo',
        description: 'Elige quién hace qué. Registra a cada uno de tus colaboradores y asigna permisos específicos para cada módulo. ¿Un mesero necesita acceso a Órdenes y Cocina? ¡Hecho! ¿Alguien más necesita ver Reportes? Tú tienes el control total para optimizar los flujos de trabajo de tu equipo.',
        color: 'text-teal-500',
    },
    {
        icon: MapIcon,
        title: 'Paso 5: Diseña tu espacio en la plataforma',
        description: 'Haz que la aplicación sea un reflejo de tu restaurante. Elabora el mapa de mesas, asígnales nombres y organiza tus áreas de servicio (terraza, salón, etc.). Asigna mesas a meseros específicos o deja que todos tengan acceso. Un mapa de mesas bien diseñado facilita la operación y mejora la comunicación del equipo.',
        color: 'text-purple-500',
    },
    {
        icon: ClipboardList,
        title: 'Paso 6: ¡La magia sucede! Genera órdenes y deleita a tus clientes',
        description: 'Tu restaurante está listo para operar. Solo selecciona una mesa en el módulo de Órdenes y comienza a registrar los pedidos de cada comensal. ¿Mesa grande con pedidos individuales? No hay problema, nuestra plataforma te permite dividir la orden por comensal para una mayor claridad.',
        color: 'text-yellow-500',
    },
    {
        icon: Truck,
        title: 'Paso 7: Opciones para llevar',
        description: '¿Un cliente quiere su platillo para llevar? Selecciona la opción en el menú de órdenes. Nuestro sistema se adapta a la perfección para gestionar pedidos fuera de las mesas.',
        color: 'text-pink-500',
    },
    {
        icon: BarChart,
        title: 'Paso 8: La inteligencia a tu servicio: Reportes y análisis de negocio',
        description: 'Obtén una visión completa de la salud de tu negocio. El módulo de Reportes te muestra el desempeño y movimiento de tu restaurante con un solo vistazo. Y lo mejor de todo: nuestra inteligencia artificial analiza tus métricas para ofrecerte recomendaciones personalizadas que te ayudarán a ser más eficiente y rentable.',
        color: 'text-green-500',
    },
    {
        icon: QrCode,
        title: 'Paso 9: Tu Menú Digital al Alcance de Todos',
        description: 'Ofrece una experiencia moderna a tus clientes. Genera tu propio menú digital en tiempo real y compártelo al instante. Puedes imprimir códigos QR para cada mesa, permitiendo que tus comensales accedan al menú actualizado directamente desde sus dispositivos móviles.',
        color: 'text-cyan-500',
    }
];

export default function GuiaPage() {
    const router = useRouter();

    return (
        <div className="bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <TacoIcon className="h-8 w-8 text-primary" />
                        <span className="font-headline text-xl">Tlacualli</span>
                    </Link>
                    <nav className="ml-auto">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative h-[60vh] min-h-[400px] w-full">
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
                            Así Funciona <span className="text-primary">Tlacualli</span> App
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg md:text-xl text-white/90 font-body">
                            Simplifica la gestión de tu restaurante y libera el tiempo para lo que realmente importa: la experiencia de tus clientes. Con Tlacualli App, digitalizar tu operación es tan sencillo como seguir estos pasos.
                        </p>
                    </div>
                </section>

                {/* Steps Section */}
                <section id="steps" className="py-12 md:py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="container max-w-4xl">
                        <div className="space-y-12">
                            {steps.map((step, index) => (
                                <Card key={index} className="bg-card/65 backdrop-blur-lg shadow-lg overflow-hidden flex flex-col md:flex-row items-center group transition-all duration-300 hover:border-primary">
                                    <div className={`p-6 md:p-8 flex-shrink-0 ${step.color}`}>
                                        <step.icon className="h-16 w-16 md:h-20 md:w-20 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                                    </div>
                                    <CardContent className="p-6 md:p-8">
                                        <h3 className="font-headline text-2xl font-bold mb-3">{step.title}</h3>
                                        <p className="text-muted-foreground font-body leading-relaxed">{step.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                
                 {/* Final CTA Section */}
                <section className="py-12 md:py-24 text-center">
                    <div className="container max-w-3xl">
                        <h2 className="font-headline text-3xl md:text-4xl font-bold">Lo que Tlacualli App hace por ti</h2>
                        <p className="mt-4 text-lg text-muted-foreground font-body">
                           Con todo el tiempo y el control que ganas, ahora puedes dedicarte a lo que realmente amas: crear experiencias inolvidables para tus clientes. De lo demás, Tlacualli App se encarga.
                        </p>
                         <p className="mt-6 text-xl font-bold font-headline text-primary">
                            ¡Bienvenido a la nueva era de la gestión de restaurantes!
                        </p>
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
