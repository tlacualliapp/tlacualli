'use server';

import { z } from 'zod';
import { sendCustomEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  message: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres.' }),
});

export async function sendContactEmail(prevState: any, formData: FormData) {
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Por favor, corrige los errores del formulario.',
    };
  }

  const { name, email, message } = validatedFields.data;
  const emailTo = process.env.GMAIL_USER || 'tlacualli.app@gmail.com';

  try {
    await sendCustomEmail({
      to: emailTo,
      subject: `Nuevo mensaje de contacto de: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Nuevo Mensaje de Contacto</h2>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Correo electrónico:</strong> ${email}</p>
            <hr>
            <h3>Mensaje:</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });
    return { success: true, message: '¡Gracias por tu mensaje! Te responderemos pronto.' };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return {
      errors: null,
      message: `Error al enviar el mensaje: ${(error as Error).message}`,
    };
  }
}
