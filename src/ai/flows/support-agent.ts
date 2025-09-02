
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
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { sendCustomEmail } from '@/lib/email';


// Define Zod schemas for input and output
const SupportAgentInputSchema = z.object({
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
    input: { schema: z.object({ ...SupportAgentInputSchema.shape, knowledgeBase: z.string() }) },
    output: {
        schema: z.object({
            response: z.string().describe("The direct, helpful, and friendly response to the user's query in Spanish."),
            requiresEscalation: z.boolean().describe("Set to true ONLY if the user's query cannot be answered with the provided knowledge, if it's a complaint, a feature request, or clearly needs human intervention. Otherwise, set to false.")
        })
    },
    prompt: `You are a friendly and expert support agent for "Tlacualli App", a restaurant management platform. Your name is Tlalli.
    Your goal is to answer user questions about how to use the platform based on the detailed knowledge base below. Always respond in Spanish.
    If the user's question is outside of this scope (e.g., a billing issue, bug report, a specific complaint, a feature request), you cannot answer it. In that case, respond politely that you will escalate the issue to the human support team and that they will be contacted by email shortly.

    === KNOWLEDGE BASE ===
    {{{knowledgeBase}}}
    ======================

    Current conversation history (if any):
    {{#if conversationHistory}}
      {{#each conversationHistory}}
        **{{role}}:** {{content}}
      {{/each}}
    {{/if}}

    User Name: {{{userName}}}
    Restaurant: {{{restaurantName}}}
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
    
    // 1. Fetch learned knowledge from previous human-answered tickets
    const solvedIncidentsQuery = query(
        collection(db, 'contacto'), 
        where('status', '==', 'closed'),
        where('adminReply', '!=', null)
    );
    const solvedIncidentsSnap = await getDocs(solvedIncidentsQuery);
    
    let learnedKnowledge = "Previously Answered Questions by Human Support:\\n";
    if (solvedIncidentsSnap.empty) {
        learnedKnowledge += "No solved incidents found yet.\\n";
    } else {
        solvedIncidentsSnap.forEach(doc => {
            const data = doc.data();
            learnedKnowledge += `- User Question: "${data.question}" -> Correct Answer: "${data.adminReply}"\\n`;
        });
    }

    const staticKnowledgeBase = `
    1.  **Workflow General:** El flujo de trabajo principal es: Inventario -> Recetas -> Menú -> Órdenes.
        -   Primero se registran los insumos en el inventario.
        -   Luego, se crean las recetas usando esos insumos.
        -   Después, se crea el menú, donde cada platillo se asocia a una receta (o a un producto directo del inventario).
        -   Finalmente, al tomar una orden, el sistema descuenta automáticamente los ingredientes del inventario.

    2.  **Módulo de Inventario:**
        -   **Items:** Aquí se registran todos los insumos y productos. Cada ítem debe tener un nombre, una categoría (carnes, vegetales, bebidas, etc.), una unidad de medida (kg, g, pz, L), y un stock mínimo. El costo promedio es crucial para los reportes de rentabilidad.
        -   **Proveedores:** Se gestionan los proveedores de los insumos.
        -   **Movimientos:** Se registran las entradas (compras), salidas (mermas) y ajustes manuales del inventario. Las salidas por venta son automáticas.

    3.  **Módulo de Menú y Recetas:**
        -   **Recetas:** Se definen los platillos con sus ingredientes exactos del inventario y las cantidades. El sistema calcula el costo total de la receta automáticamente.
        -   **Platillos del Menú:** Se crea el menú público. Cada platillo del menú debe estar asociado a una receta para que el sistema descuente los ingredientes. Los productos que no necesitan receta (ej. una lata de refresco) se pueden asociar directamente a un ítem del inventario. Se define el precio de venta aquí.
        -   **Inspiración IA:** Hay una función que usa IA para sugerir nuevas recetas basadas en el inventario disponible.

    4.  **Módulo de Personal (Empleados):**
        -   Se registran los empleados con su nombre, correo y un teléfono (que sirve como contraseña inicial).
        -   Se asignan perfiles: "Administrador" (acceso total) o "Empleado" (acceso restringido).
        -   **Permisos:** A los empleados se les pueden asignar permisos específicos para cada módulo (Órdenes, Cocina, Inventario, etc.), lo que permite un control granular.

    5.  **Módulo de Mapa Digital:**
        -   Se diseñan las áreas del restaurante (Salón, Terraza, etc.).
        -   Dentro de cada área, se añaden las mesas (cuadradas o redondas) y se arrastran a su posición en el mapa.
        -   **Asignaciones:** Se pueden asignar áreas o mesas específicas a ciertos meseros para organizar el servicio.

    6.  **Módulo de Órdenes:**
        -   Es la pantalla principal para meseros. Se visualiza el mapa de mesas.
        -   Al hacer clic en una mesa, se puede iniciar una nueva orden, añadir platillos del menú o ver una orden existente.
        -   **Cuentas Separadas:** Se pueden crear subcuentas para dividir el consumo entre varios comensales en una misma mesa.
        -   **Órdenes para Llevar:** Existe un botón para registrar órdenes que no están asociadas a una mesa.
        -   Al "Enviar a Cocina", los platillos aparecen en el Módulo de Cocina.

    7.  **Módulo de Cocina:**
        -   Muestra las órdenes activas en tarjetas.
        -   El personal de cocina puede marcar cada platillo como "listo".
        -   Cuando todos los platillos de una orden están listos, la orden se marca como "Lista para recoger" y el mesero es notificado visualmente en la pantalla de órdenes.

    8.  **Módulo de Facturación (Billing) y Planes:**
        -   Los usuarios pueden ver su plan actual (Demo, Esencial, Pro, Ilimitado).
        -   Pueden cambiar de plan y realizar el pago a través de Stripe.
        -   Pueden ver su historial de pagos y descargar recibos.
        -   Si un pago falla, el 'subscriptionStatus' cambia a "inactive" y el acceso a otros módulos se bloquea hasta que se regularice el pago. El periodo de prueba del plan Demo dura 15 días.

    9.  **Módulo de Reportes:**
        -   **Ventas:** Muestra el total de ventas en un rango de fechas, filtrado por mesa o estado.
        -   **Rentabilidad:** Analiza el costo de cada platillo (según su receta) contra su precio de venta, mostrando el margen de ganancia.
        -   **Consumo:** Muestra qué ingredientes se han consumido más.
        -   **Inventario Valorado:** Calcula el valor monetario total del stock actual.
        -   **Analíticas Operativas:** Muestra horas pico, rotación de mesas y los platillos más vendidos.
        -   **Optimización IA:** Una función de IA analiza las ventas y sugiere optimizaciones para el menú.
    `;

    // 2. Call the AI prompt with the combined knowledge
    const { output } = await prompt({ ...input, knowledgeBase: `${staticKnowledgeBase}\\n${learnedKnowledge}` });
    
    if (!output) {
      throw new Error("AI did not generate a valid response.");
    }
    
    const { response, requiresEscalation } = output;

    // 3. Log the interaction to Firestore
    const incidentData = {
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        restaurantId: input.restaurantId,
        restaurantName: input.restaurantName,
        question: input.message,
        conversationHistory: [...(input.conversationHistory || []), { role: 'user', content: input.message }, { role: 'model', content: response}],
        aiResponse: response,
        escalated: requiresEscalation,
        status: requiresEscalation ? 'escalated' : 'closed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const incidentRef = await addDoc(collection(db, 'contacto'), incidentData);
    
    // 4. Escalate via email if needed
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
