'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const logSchema = z.object({
  userName: z.string(),
  userProfile: z.any(),
  restaurantId: z.string().nullable(),
  restaurantName: z.string(),
});

/**
 * Logs a login event to the monitor collection in Firestore.
 * This is a server action and is safe to call from the client.
 */
export async function logLogin(input: z.infer<typeof logSchema>) {
  const validatedFields = logSchema.safeParse(input);

  if (!validatedFields.success) {
    console.error("Invalid input for logLogin:", validatedFields.error);
    // We don't throw an error, as failing to log shouldn't break the login flow.
    return;
  }

  const { userName, userProfile, restaurantId, restaurantName } = validatedFields.data;

  try {
    await adminDb.collection('monitor').add({
      accion: "Inicio de sesion",
      usuarioNombre: userName,
      usuarioPerfil: userProfile,
      restauranteId: restaurantId,
      restauranteNombre: restaurantName,
      fecha: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to write to monitor log:", error);
    // Also don't re-throw here. The user should be able to log in even if logging fails.
  }
}
