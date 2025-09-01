
'use server';

/**
 * @fileOverview Provides recipe suggestions based on available inventory.
 *
 * - getRecipeSuggestions - A function that generates recipe ideas.
 * - RecipeSuggestionInput - The input type for the getRecipeSuggestions function.
 * - RecipeSuggestionOutput - The return type for the getRecipeSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

// Define Zod schemas for input and output
const RecipeSuggestionInputSchema = z.object({
  restaurantId: z.string(),
  userPlan: z.enum(['demo', 'esencial', 'pro', 'ilimitado']),
});
export type RecipeSuggestionInput = z.infer<typeof RecipeSuggestionInputSchema>;

const SuggestedIngredientSchema = z.object({
  itemName: z.string().describe('The name of the ingredient.'),
  itemId: z.string().describe('The ID of the ingredient from the provided inventory list.'),
  quantity: z.number().describe('The suggested quantity of this ingredient for the recipe.'),
  unit: z.string().describe('The unit of measure for the quantity (e.g., kg, g, pz, L).'),
});

const RecipeSuggestionSchema = z.object({
  recipeName: z.string().describe('A creative and appealing name for the suggested recipe.'),
  ingredients: z.array(SuggestedIngredientSchema).describe('A list of ingredients from the inventory to be used in this recipe.'),
});

const RecipeSuggestionOutputSchema = z.object({
  suggestions: z.array(RecipeSuggestionSchema).describe('An array of 3 to 5 unique recipe suggestions.'),
});
export type RecipeSuggestionOutput = z.infer<typeof RecipeSuggestionOutputSchema>;

// Define the main exported function
export async function getRecipeSuggestions(
  input: RecipeSuggestionInput
): Promise<RecipeSuggestionOutput> {
  return recipeSuggestionsFlow(input);
}

// Define the Genkit prompt
const prompt = ai.definePrompt({
  name: 'recipeSuggestionsPrompt',
  input: { schema: z.object({ inventoryList: z.string() }) },
  output: { schema: RecipeSuggestionOutputSchema },
  prompt: `You are a creative and expert chef who specializes in creating profitable and delicious dishes from a given set of ingredients.
Your task is to analyze the following list of available inventory items and suggest 3 to 5 unique and interesting recipes.

The response must be in Spanish.

For each recipe, provide a creative name and a list of the ingredients from the provided list that are needed to prepare it. You must also suggest a realistic quantity for each ingredient.

Available Inventory Items (format: "itemName, itemId, unitOfMeasure"):
{{{inventoryList}}}

Provide your response in a structured JSON format.
`,
});

// Define the Genkit flow
const recipeSuggestionsFlow = ai.defineFlow(
  {
    name: 'recipeSuggestionsFlow',
    inputSchema: RecipeSuggestionInputSchema,
    outputSchema: RecipeSuggestionOutputSchema,
  },
  async (input) => {
    const { restaurantId, userPlan } = input;
    
    const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
    const inventoryCollectionRef = collection(db, `${collectionName}/${restaurantId}/inventoryItems`);
    const inventorySnapshot = await getDocs(inventoryCollectionRef);

    if (inventorySnapshot.empty) {
      throw new Error("No inventory items found to generate suggestions.");
    }
    
    // Format inventory for the prompt
    const inventoryList = inventorySnapshot.docs.map(doc => {
        const item = doc.data();
        // Format: "Tomate, 123xyz, kg"
        return `${item.name}, ${doc.id}, ${item.unitOfMeasure}`;
    }).join('\\n');

    // Call the prompt with the inventory data
    const { output } = await prompt({ inventoryList });
    return output || { suggestions: [] };
  }
);
