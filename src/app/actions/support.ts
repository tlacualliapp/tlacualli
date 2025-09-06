'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
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
    await sendSupportResponseEmail({
      to: userEmail,
      name: userName,
      question: originalQuestion,
      reply: adminReply,
    });

    const incidentRef = adminDb.collection('support_incidents').doc(incidentId);
    await incidentRef.update({
      status: 'closed',
      adminReply: adminReply,
      resolvedAt: Timestamp.now(),
    });

    return { success: true };

  } catch (error) {
    console.error('Error processing support reply:', error);
    throw new Error('Failed to process support reply.');
  }
}
