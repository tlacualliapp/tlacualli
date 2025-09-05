
import { NextResponse } from 'next/server';

export async function GET() {
  // Por seguridad, no expondremos los valores de las claves,
  // solo confirmaremos si existen o no en el entorno del servidor.
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    // La clave que nos interesa:
    GEMINI_API_KEY_EXISTS: process.env.GEMINI_API_KEY ? 'Presente' : 'AUSENTE',
    GOOGLE_API_KEY_EXISTS: process.env.GOOGLE_API_KEY ? 'Presente' : 'AUSENTE',
    // Para comparar, veamos una de las claves de Firebase (no debería estar aquí)
    NEXT_PUBLIC_FIREBASE_PROJECT_ID_EXISTS: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Presente' : 'AUSENTE',
    // Y las claves para el envío de email
    EMAIL_USER_EXISTS: process.env.EMAIL_USER ? 'Presente' : 'AUSENTE',
  };

  return NextResponse.json(envCheck);
}
