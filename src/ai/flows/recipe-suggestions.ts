'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebaseAdmin';

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

export async function getRecipeSuggestions(
  input: RecipeSuggestionInput
): Promise<RecipeSuggestionOutput> {
  return recipeSuggestionsFlow(input);
}

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

const recipeSuggestionsFlow = ai.defineFlow(
  {
    name: 'recipeSuggestionsFlow',
    inputSchema: RecipeSuggestionInputSchema,
    outputSchema: RecipeSuggestionOutputSchema,
  },
  async (input) => {
    const { restaurantId, userPlan } = input;
    
    const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
    const inventoryCollectionRef = adminDb.collection(`${collectionName}/${restaurantId}/inventoryItems`);
    const inventorySnapshot = await inventoryCollectionRef.get();

    if (inventorySnapshot.empty) {
      throw new Error("No inventory items found to generate suggestions.");
    }
    
    const inventoryList = inventorySnapshot.docs.map(doc => {
        const item = doc.data();
        return `${item.name}, ${doc.id}, ${item.unitOfMeasure}`;
    }).join('\n');

    const { output } = await prompt({ inventoryList });
    return output || { suggestions: [] };
  }
);
