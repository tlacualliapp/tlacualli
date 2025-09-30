
import { BookOpen, Users, Utensils, Warehouse, ClipboardList, BarChart2, Map, ShoppingBag, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
    {
        icon: Warehouse,
        title: 'Paso 1: Controla tu Inventario',
        description: 'Registra todos tus insumos, desde alimentos hasta bebidas y todos tus ingredientes, con su unidad de medida y costo. Un inventario exacto es el cimiento para una gestión sin sorpresas y decisiones acertadas.',
        color: 'text-green-500',
    },
    {
        icon: Utensils,
        title: 'Paso 2: Dale Vida a tus Recetas',
        description: 'Digitaliza cada receta con cantidades precisas. La plataforma descontará el stock en tiempo real con cada orden, actualizando tu inventario automáticamente. ¡La precisión es la clave de la eficiencia!',
        color: 'text-red-500',
    },
    {
        icon: BookOpen,
        title: 'Paso 3: Crea tu Menú en un Instante',
        description: 'Organiza tu oferta en categorías. Asigna recetas a cada platillo o incluye productos directos del inventario. Con unos pocos clics, tu menú estará listo para brillar y seducir a tus clientes.',
        color: 'text-blue-500',
    },
    {
        icon: Users,
        title: 'Paso 4: Empodera a tu Equipo',
        description: 'Registra a tus colaboradores y asigna permisos específicos por módulo. Define quién accede a Órdenes, Cocina o Reportes. Un equipo conectado con roles claros es la clave para un servicio excepcional.',
        color: 'text-yellow-500',
    },
    {
        icon: Map,
        title: 'Paso 5: Diseña tu Espacio',
        description: 'Haz que la app sea un reflejo de tu restaurante. Crea tu mapa de mesas, organiza tus áreas de servicio y asígnalas a tu personal. Un mapa bien diseñado optimiza la operación y la comunicación.',
        color: 'text-indigo-500',
    },
    {
        icon: ClipboardList,
        title: 'Paso 6: Procesa Órdenes con Facilidad',
        description: 'Selecciona una mesa y comienza a registrar pedidos. Nuestra plataforma te permite incluso dividir la cuenta por comensal, garantizando claridad y un servicio fluido, sin importar el tamaño del grupo.',
        color: 'text-purple-500',
    },
    {
        icon: ShoppingBag,
        title: 'Paso 7: Gestiona Pedidos para Llevar',
        description: '¿Un cliente quiere su platillo para llevar? Con un solo clic puedes gestionar órdenes fuera de las mesas. Nuestro sistema se adapta perfectamente a la dinámica de los pedidos para llevar y a domicilio.',
        color: 'text-pink-500',
    },
    {
        icon: BarChart2,
        title: 'Paso 8: Analiza y Optimiza con IA',
        description: 'La información es poder. El módulo de Reportes te muestra el desempeño de tu negocio de un vistazo, y nuestra IA analiza tus métricas para darte recomendaciones y ayudarte a ser más rentable.',
        color: 'text-orange-500',
    },
    {
        icon: QrCode,
        title: 'Paso 9: Lanza tu Menú Digital',
        description: 'Ofrece una experiencia moderna. Genera al instante tu menú digital y compártelo mediante códigos QR en tus mesas. Tus clientes podrán acceder a la carta actualizada directamente desde su móvil.',
        color: 'text-teal-500',
    }
];

const recommendations = [
    { title: 'Conoce tu Rentabilidad al Detalle', description: 'Sumérgete en los números. Calcula con precisión el costo de cada ingrediente y la preparación de tus platillos. Define tu margen de ganancia ideal y úsalo como brújula para establecer precios justos y rentables. ¡La claridad financiera es el primer paso hacia el éxito!' },
    { title: 'Aplica la Ingeniería de Menú', description: 'Clasifica tus platillos en "Estrellas" (los más populares y rentables), "Vacas Lecheras" (populares pero menos rentables), "Puzzles" (rentables pero no tan populares) y "Perros" (baja popularidad y rentabilidad). Enfoca tu energía en promocionar tus Estrellas y convierte a los Puzzles en los próximos favoritos de tus clientes.' },
    { title: 'Diseña con Estrategia y Estilo', description: 'El diseño de tu menú debe seducir a primera vista. Utiliza un layout atractivo y guía la mirada de tus clientes hacia los platillos que más te interesa vender. Coloca tus "Estrellas" en posiciones privilegiadas, como la esquina superior derecha, para capturar la atención de inmediato.' },
    { title: 'Enamora con las Palabras', description: 'Crea descripciones que despierten el apetito. Utiliza adjetivos evocadores y narra la historia de tus platillos: menciona la frescura de los ingredientes, las técnicas de cocción que los hacen únicos y su origen si aporta valor. ¡Haz que tus clientes saboreen el platillo antes de pedirlo!' },
    { title: 'Optimiza tus Precios con Inteligencia', description: 'Juega con la psicología de los precios. Estrategias como usar $9.99 en lugar de $10.00 pueden tener un gran impacto. Ofrece un abanico de opciones a diferentes precios para que cada cliente encuentre una propuesta de valor que se ajuste a sus expectativas.' },
    { title: 'Crea Ofertas y Promociones Irresistibles', description: 'Mantén la emoción con promociones dinámicas. Desde el clásico menú del día hasta programas de lealtad que premien la recurrencia. Usa las ofertas especiales de forma estratégica para dar a conocer platillos con gran potencial pero menor rotación.' },
    { title: 'Domina la Gestión de tu Inventario', description: 'La rentabilidad también se encuentra en la eficiencia. Planifica tus compras con inteligencia para minimizar el desperdicio. Apuesta por ingredientes versátiles que puedas utilizar en múltiples recetas y convierte cada gramo de tu inventario en ganancia.' },
    { title: 'Convierte a tu Equipo en Embajadores', description: 'Un personal bien informado es tu mejor aliado. Capacítalos para que no solo conozcan el menú, sino que se apasionen por él. Enséñales a identificar las necesidades del cliente y a recomendar con confianza los platillos más rentables y deliciosos.' },
    { title: 'Escucha, Aprende y Mejora Constantemente', description: 'La opinión de tus clientes es un tesoro. Invítalos a compartir su experiencia y utiliza su feedback como una guía para perfeccionar tu oferta gastronómica y el servicio. La mejora continua es el sello de los grandes restaurantes.' },
    { title: 'Adáptate y Mantente a la Vanguardia', description: 'El mundo culinario está en constante evolución. Mantente al día con las nuevas tendencias y no temas innovar. Incorporar opciones vegetarianas, veganas o libres de gluten no solo amplía tu mercado, sino que demuestra que tu restaurante es moderno e inclusivo.' },
];

export default function GuiaPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Bienvenido a la Guía de Éxito</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Aquí comienza tu viaje hacia la gestión total de tu restaurante. Sigue estos 9 pasos fundamentales para configurar tu cuenta y desbloquear todo el potencial de nuestra plataforma.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {steps.map((step, index) => (
          <Card key={index} className="border-l-4 border-primary bg-card/50 backdrop-blur-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                <step.icon className={`w-8 h-8 ${step.color}`} />
                <CardTitle className="text-xl font-semibold">{step.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <header className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Recomendaciones para un Menú Exitoso</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Tu menú es el corazón de tu restaurante. Aquí te compartimos 10 estrategias clave para transformarlo en una máquina de rentabilidad y satisfacción.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">{`${index + 1}. ${rec.title}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground">{rec.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </section>

    </div>
  );
}
