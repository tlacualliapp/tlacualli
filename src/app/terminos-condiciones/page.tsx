
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TacoIcon } from '@/components/icons/logo';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function TermsAndConditionsPage() {
  const router = useRouter();
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
        </div>
      </header>

      <main className="py-12 md:py-16 flex items-center justify-center">
        <div className="container">
           <Button variant="outline" size="sm" className="mb-8" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('Volver')}
            </Button>
          <Card className="bg-card/65 backdrop-blur-lg shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-3xl md:text-4xl font-bold text-center">
                {t('Términos y Condiciones de Servicio de Tlacualli App')}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none font-body text-foreground/80 space-y-6">
              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('1. Aceptación de los Términos')}</h2>
                <p>{t('Al registrarse, acceder o utilizar Tlacualli App, usted acepta y se compromete a cumplir con estos Términos y Condiciones de Servicio. Si no está de acuerdo con estos términos, no debe utilizar la aplicación. Nos reservamos el derecho de actualizar estos términos en cualquier momento, y el uso continuado de la aplicación implica la aceptación de dichos cambios.')}</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('2. Descripción del Servicio')}</h2>
                <p>{t('Tlacualli App es una plataforma web de gestión para restaurantes que permite a los usuarios:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('Registrar y administrar información de su restaurante (nombre, datos de contacto, etc.).')}</li>
                  <li>{t('Gestionar inventarios de productos.')}</li>
                  <li>{t('Almacenar y organizar recetas.')}</li>
                  <li>{t('Crear y mantener menús.')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('3. Registro y Cuentas de Usuario')}</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>{t('Elegibilidad:')}</strong> {t('Para usar la aplicación, debe tener al menos 18 años de edad y la capacidad legal para celebrar contratos.')}</li>
                    <li><strong>{t('Información de la Cuenta:')}</strong> {t('Usted se compromete a proporcionar información veraz, precisa y completa al momento del registro y a mantenerla actualizada.')}</li>
                    <li><strong>{t('Responsabilidad de la Cuenta:')}</strong> {t('Usted es responsable de mantener la confidencialidad de su nombre de usuario y contraseña y de todas las actividades que ocurran bajo su cuenta. Debe notificarnos de inmediato cualquier uso no autorizado de su cuenta.')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('4. Uso del Servicio')}</h2>
                <p><strong>{t('Licencia de Uso:')}</strong> {t('Tlacualli App le otorga una licencia limitada, no exclusiva e intransferible para usar la aplicación para fines legítimos de su negocio, de acuerdo con estos términos.')}</p>
                <p><strong>{t('Uso Prohibido:')}</strong> {t('Usted se compromete a no utilizar la aplicación para:')}</p>
                 <ul className="list-disc pl-6 space-y-2">
                  <li>{t('Fines ilegales o no autorizados.')}</li>
                  <li>{t('Dañar, deshabilitar, sobrecargar o perjudicar la aplicación o los servidores.')}</li>
                  <li>{t('Interferir con el uso de la aplicación por parte de otros usuarios.')}</li>
                  <li>{t('Recopilar información de otros usuarios sin su consentimiento.')}</li>
                  <li>{t('Subir contenido que sea ilegal, ofensivo, amenazante, difamatorio o que infrinja derechos de terceros.')}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('5. Propiedad Intelectual')}</h2>
                <p><strong>{t('Nuestra Propiedad:')}</strong> {t('El diseño, logotipos, código, interfaz y todo el contenido de Tlacualli App son propiedad exclusiva de Tlacualli App y están protegidos por leyes de derechos de autor y propiedad intelectual.')}</p>
                <p><strong>{t('Su Propiedad:')}</strong> {t('Usted conserva todos los derechos sobre la información que sube a la aplicación (inventarios, recetas, menús). Al subir dicho contenido, nos otorga una licencia limitada para usar, almacenar y mostrar esa información con el fin de proporcionar el servicio.')}</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('6. Exención de Responsabilidad y Limitación de Garantías')}</h2>
                <p><strong>{t('Servicio "Tal Cual":')}</strong> {t('La aplicación se proporciona "tal cual" y "según esté disponible", sin garantías de ningún tipo, ya sean expresas o implícitas. No garantizamos que el servicio sea ininterrumpido, seguro, libre de errores o que los resultados obtenidos de su uso sean precisos o confiables.')}</p>
                <p><strong>{t('Su Responsabilidad:')}</strong> {t('Usted es el único responsable de la exactitud de los datos que ingresa a la aplicación. No nos hacemos responsables de pérdidas o daños resultantes de errores en los datos que usted ingrese o de la información proporcionada por usted.')}</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('7. Limitación de Responsabilidad')}</h2>
                <p>{t('En la medida máxima permitida por la ley, Tlacualli App no será responsable por ningún daño directo, indirecto, incidental, especial, consecuencial o punitivo, incluyendo, pero no limitado a, pérdida de ganancias, datos o fondo de comercio, que resulten de:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>{t('Su uso o incapacidad para usar la aplicación.')}</li>
                    <li>{t('Cualquier contenido o conducta de terceros en la aplicación.')}</li>
                    <li>{t('Acceso no autorizado a sus datos o la alteración de los mismos.')}</li>
                </ul>
              </section>
              
              <section>
                 <h2 className="font-headline text-2xl font-semibold">{t('8. Indemnización')}</h2>
                 <p>{t('Usted acepta indemnizar y eximir de responsabilidad a Tlacualli App, sus directivos, empleados y agentes, de cualquier reclamo, demanda, daño, obligación, pérdida, responsabilidad, costo o gasto (incluidos los honorarios de abogados) que surja de:')}</p>
                 <ul className="list-disc pl-6 space-y-2">
                    <li>{t('Su uso de la aplicación.')}</li>
                    <li>{t('El incumplimiento de estos Términos y Condiciones.')}</li>
                    <li>{t('El uso de su cuenta por parte de terceros con su consentimiento.')}</li>
                 </ul>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('9. Modificación y Terminación del Servicio')}</h2>
                <p>{t('Nos reservamos el derecho de modificar, suspender o discontinuar el servicio (o cualquier parte de él) en cualquier momento, con o sin previo aviso. También podemos suspender o dar por terminada su cuenta si viola estos términos.')}</p>
              </section>

              <section>
                <h2 className="font-headline text-2xl font-semibold">{t('10. Legislación Aplicable y Jurisdicción')}</h2>
                <p>{t('Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes de México. Cualquier disputa que surja en relación con estos términos se someterá a la jurisdicción exclusiva de los tribunales de la Ciudad de México.')}</p>
              </section>

              <section>
                 <h2 className="font-headline text-2xl font-semibold">{t('11. Contacto')}</h2>
                 <p>{t('Si tiene alguna pregunta sobre estos Términos y Condiciones, por favor contáctenos a través de tlacualli.app@gmail.com.')}</p>
              </section>
              
            </CardContent>
          </Card>
        </div>
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
