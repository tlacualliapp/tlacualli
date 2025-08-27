
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TacoIcon } from '@/components/icons/logo';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
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
          <nav className="ml-auto flex items-center gap-4">            
            <Button asChild>
                <Link href="/login">Acceso a Usuarios</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="py-12 md:py-16">
        <div className="container">
           <Button variant="outline" size="sm" className="mb-8" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
            </Button>
          <Card className="bg-card/65 backdrop-blur-lg shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-3xl md:text-4xl font-bold text-center">
                Aviso de Privacidad Integral de Tlacualli App
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none font-body text-foreground/80 space-y-6">
              <section>
                <h2 className="font-headline text-2xl font-semibold">1. Identidad y Domicilio del Responsable</h2>
                <p>Tlacualli App, es el responsable del tratamiento de los datos personales que usted nos proporciona. Nuestro compromiso es proteger su privacidad y su información.</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">2. Datos Personales que se Recaban</h2>
                <p>Para la correcta prestación de nuestros servicios, Tlacualli App recaba los siguientes datos personales:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Datos de restaurantes:</strong> Nombre, teléfono, razón social, domicilio fiscal (calle, número, colonia, código postal, ciudad, estado) y Registro Federal de Contribuyentes (RFC).</li>
                  <li><strong>Datos de usuarios:</strong> Nombre, apellidos, correo electrónico y teléfono.</li>
                  <li><strong>Datos de operación:</strong> Información sobre inventarios de productos, recetas y menús.</li>
                </ul>
                <p>Le informamos que no recabamos datos personales sensibles, como origen racial o étnico, estado de salud presente o futuro, información genética, creencias religiosas, filosóficas y morales, afiliación sindical, opiniones políticas o preferencias sexuales.</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">3. Fines del Tratamiento de Datos Personales</h2>
                <p>Los datos personales que recabamos serán utilizados para los siguientes fines que son necesarios para la prestación del servicio:</p>
                 <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Gestión del sistema:</strong> Crear y mantener la cuenta de su restaurante y de sus usuarios dentro de la aplicación.</li>
                  <li><strong>Funcionalidades de la aplicación:</strong> Permitir el registro, gestión y operación diaria de inventarios, recetas y menús a través de nuestra plataforma.</li>
                  <li><strong>Comunicación:</strong> Contactar a los usuarios para informarles sobre el funcionamiento de la aplicación, actualizaciones, notificaciones importantes o resolver dudas técnicas y operativas.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">4. Opciones y Medios para Limitar el Uso o Divulgación de los Datos</h2>
                <p>Usted puede limitar el uso y divulgación de sus datos personales enviando una solicitud por escrito a la dirección de correo electrónico tlacualli.app@gmail.com. En esta solicitud, debe indicar claramente su deseo de limitar el uso o divulgación de su información.</p>
              </section>
              
              <section>
                <h2 className="font-headline text-2xl font-semibold">5. Medios para Ejercer los Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
                <p>Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).</p>
                <p>Para ejercer cualquiera de los derechos ARCO, usted debe enviar una solicitud al correo electrónico tlacualli.app@gmail.com que debe contener:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Nombre completo del titular.</li>
                    <li>Documento de identificación oficial que acredite su identidad.</li>
                    <li>Descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO.</li>
                    <li>Cualquier otro elemento que facilite la localización de los datos personales.</li>
                </ul>
                 <p>Responderemos a su solicitud en un plazo máximo de 20 días hábiles a partir de la recepción.</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">6. Revocación del Consentimiento</h2>
                <p>Usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el tratamiento de sus datos personales. Para ello, debe enviar una solicitud al correo electrónico tlacualli.app@gmail.com siguiendo el mismo procedimiento y requisitos establecidos en el punto 5 para el ejercicio de los derechos ARCO.</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">7. Transferencia de Datos Personales</h2>
                <p>Le informamos que sus datos personales no son transferidos a terceros. Su información es para uso exclusivo de la operación de Tlacualli App. No vendemos, alquilamos ni compartimos su información personal con otras empresas o individuos.</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">8. Medidas de Seguridad</h2>
                <p>Nos comprometemos a proteger su información personal con medidas de seguridad administrativas, técnicas y físicas para evitar su daño, pérdida, alteración, destrucción o uso, acceso o tratamiento no autorizado.</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">9. Cambios en el Aviso de Privacidad</h2>
                <p>El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales, de nuestras propias necesidades o por otras causas. Nos comprometemos a mantenerlo informado sobre los cambios a través de la sección de "Aviso de Privacidad" de nuestra aplicación, nuestro sitio web, o a través de notificaciones push.</p>
              </section>

              <footer className="pt-4 text-sm text-muted-foreground">
                <p>Fecha de la última actualización: 27 de agosto 2025</p>
              </footer>
            </CardContent>
          </Card>
        </div>
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
