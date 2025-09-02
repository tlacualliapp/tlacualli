'use server';

/**
 * @fileOverview A support agent for Tlacualli App.
 *
 * - getSupportResponse - A function that handles user support queries.
 * - SupportAgentInput - The input type for the getSupportResponse function.
 * - SupportAgentOutput - The return type for the getSupportResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendCustomEmail } from '@/lib/email';


// Define Zod schemas for input and output
export const SupportAgentInputSchema = z.object({
  userId: z.string().describe("The user's unique ID."),
  userName: z.string().describe("The user's full name."),
  userEmail: z.string().email().describe("The user's email address."),
  restaurantId: z.string().describe("The ID of the user's restaurant."),
  restaurantName: z.string().describe("The name of the user's restaurant."),
  message: z.string().describe("The user's question or support request."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe("The history of the conversation so far.")
});
export type SupportAgentInput = z.infer<typeof SupportAgentInputSchema>;

const SupportAgentOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's direct response to the user."),
  escalated: z.boolean().describe("Whether the query was escalated to a human."),
  incidentId: z.string().describe("The ID of the created incident document in Firestore."),
});
export type SupportAgentOutput = z.infer<typeof SupportAgentOutputSchema>;

export async function getSupportResponse(input: SupportAgentInput): Promise<SupportAgentOutput> {
  return supportAgentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'supportAgentPrompt',
    input: {
        schema: z.object({
            message: z.string(),
            userName: z.string(),
            conversationHistory: z.array(z.any()).optional(),
        })
    },
    output: {
        schema: z.object({
            response: z.string().describe("The direct, helpful, and friendly response to the user's query in Spanish."),
            requiresEscalation: z.boolean().describe("Set to true ONLY if the user's query cannot be answered with the provided knowledge, if it's a complaint, a feature request, or clearly needs human intervention. Otherwise, set to false.")
        })
    },
    prompt: `You are a friendly and expert support agent for "Tlacualli App", a restaurant management platform. Your name is Tlalli.
    Your goal is to answer user questions about how to use the platform. Always respond in Spanish.
    
    Here is a summary of the platform's workflow:
    1.  **Inventory:** Users register all their raw ingredients and products (e.g., tomatoes in kg, soda bottles in pieces).
    2.  **Recipes:** Users create recipes for their dishes, specifying the exact quantity of each inventory item needed.
    3.  **Menu:** Users create their public menu, linking each dish to a recipe. Dishes that don't need a recipe (like a can of soda) can be linked directly to an inventory item.
    4.  **Staff:** Users register their employees and assign permissions for different modules.
    5.  **Digital Map:** Users design their restaurant layout with tables and service areas.
    6.  **Orders:** Waitstaff take orders by selecting a table, adding items from the menu. The system automatically deducts ingredients from inventory based on the recipes of the items sold.
    7.  **Reports:** The system provides analytics on sales, costs, and profitability. An AI feature gives optimization suggestions.

    Based on this knowledge, answer the following user query. Be concise and helpful.
    If the user's question is outside of this scope, if it's a complaint, a bug report, a billing issue, or a feature request, you cannot answer it. In that case, respond politely that you will escalate the issue to the human support team and that they will be contacted by email shortly.

    Current conversation history (if any):
    {{#if conversationHistory}}
      {{#each conversationHistory}}
        **{{role}}:
        {{content}}
      {{/each}}
    {{/if}}

    User Name: {{{userName}}}
    User's new message:
    {{{message}}}
    `,
    config: {
        temperature: 0.3,
    },
});

const supportAgentFlow = ai.defineFlow(
  {
    name: 'supportAgentFlow',
    inputSchema: SupportAgentInputSchema,
    outputSchema: SupportAgentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
        message: input.message,
        userName: input.userName,
        conversationHistory: input.conversationHistory,
    });
    
    if (!output) {
      throw new Error("AI did not generate a valid response.");
    }
    
    const { response, requiresEscalation } = output;

    // Log the interaction to Firestore
    const incidentData = {
        ...input,
        aiResponse: response,
        escalated: requiresEscalation,
        status: requiresEscalation ? 'escalated' : 'closed', // 'closed' if AI handles it, 'escalated' otherwise
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const incidentRef = await addDoc(collection(db, 'contacto'), incidentData);
    
    // Escalate via email if needed
    if (requiresEscalation) {
        const emailTo = process.env.EMAIL_TO || 'tlacualli.app@gmail.com';
        await sendCustomEmail({
            to: emailTo,
            subject: `[Tlacualli Support Escalation] New issue from ${input.restaurantName}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Support Request Escalated</h2>
                    <p>A new support request requires human attention.</p>
                    <hr>
                    <p><strong>Restaurant:</strong> ${input.restaurantName}</p>
                    <p><strong>User:</strong> ${input.userName} (${input.userEmail})</p>
                    <p><strong>Incident ID:</strong> ${incidentRef.id}</p>
                    <hr>
                    <h3>User's Message:</h3>
                    <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
                        ${input.message.replace(/\n/g, '<br>')}
                    </p>
                    <p><em>This incident has been logged in the 'contacto' collection in Firestore.</em></p>
                </div>
            `,
        });
    }

    return {
      aiResponse: response,
      escalated: requiresEscalation,
      incidentId: incidentRef.id,
    };
  }
);
