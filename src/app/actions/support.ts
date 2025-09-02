
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { sendSupportResponseEmail } from '@/lib/email';

const supportReplySchema = z.object({
  incidentId: z.string(),
  userEmail: z.string().email(),
  userName: z.string(),
  originalQuestion: z.string(),
  adminReply: z.string().min(10, 'The reply must be at least 10 characters long.'),
});

export async function sendSupportReply(input: z.infer<typeof supportReplySchema>) {
  const validatedFields = supportReplySchema.safeParse(input);

  if (!validatedFields.success) {
    throw new Error('Invalid input data.');
  }

  const { incidentId, userEmail, userName, originalQuestion, adminReply } = validatedFields.data;

  try {
    // 1. Send the email to the user
    await sendSupportResponseEmail({
      to: userEmail,
      name: userName,
      question: originalQuestion,
      reply: adminReply,
    });

    // 2. Update the incident in Firestore
    const incidentRef = doc(db, 'contacto', incidentId);
    await updateDoc(incidentRef, {
      status: 'closed',
      adminReply: adminReply,
      updatedAt: Timestamp.now(),
    });

    return { success: true, message: 'Reply sent and incident updated successfully.' };
  } catch (error) {
    console.error('Error sending support reply:', error);
    throw new Error(`Failed to process the reply: ${(error as Error).message}`);
  }
}
