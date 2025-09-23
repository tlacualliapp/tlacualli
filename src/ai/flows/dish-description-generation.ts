'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DishDescriptionInputSchema = z.object({
  dishName: z.string().describe('The name of the dish for which to generate a description.'),
  ingredients: z.array(z.string()).describe('A list of the main ingredients in the dish.'),
});
export type DishDescriptionInput = z.infer<typeof DishDescriptionInputSchema>;

const DishDescriptionOutputSchema = z.object({
  description: z.string().describe('A creative, mouth-watering, and appealing description for the dish, written in Spanish.'),
});
export type DishDescriptionOutput = z.infer<typeof DishDescriptionOutputSchema>;

export async function getDishDescription(input: DishDescriptionInput): Promise<DishDescriptionOutput> {
  return dishDescriptionGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dishDescriptionGenerationPrompt',
  input: { schema: DishDescriptionInputSchema },
  output: { schema: DishDescriptionOutputSchema },
  prompt: `You are an expert food writer and restaurant marketing consultant.
Your task is to create a compelling, mouth-watering, and appealing menu description for a dish.
The description must be in Spanish. It should be relatively short, punchy, and make the customer want to order it.

Dish Name: {{{dishName}}}
Main Ingredients: {{#each ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on this information, generate an enticing description.
Provide ONLY the description text in the specified JSON format.
`,
});

const dishDescriptionGenerationFlow = ai.defineFlow(
  {
    name: 'dishDescriptionGenerationFlow',
    inputSchema: DishDescriptionInputSchema,
    outputSchema: DishDescriptionOutputSchema,
  },
  async (input) => {
    if (!input.dishName || input.ingredients.length === 0) {
      throw new Error('Dish name and ingredients are required to generate a description.');
    }
    const { output } = await prompt(input);
    return output!;
  }
);
