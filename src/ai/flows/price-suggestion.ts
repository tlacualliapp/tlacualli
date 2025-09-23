'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PriceSuggestionInputSchema = z.object({
  dishName: z.string().describe('The name of the dish for which to suggest a price.'),
  cost: z.number().describe('The total cost of the ingredients for the dish.'),
});
export type PriceSuggestionInput = z.infer<typeof PriceSuggestionInputSchema>;

const PriceSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().describe('The suggested retail price for the dish, rounded to the nearest whole number.'),
});
export type PriceSuggestionOutput = z.infer<typeof PriceSuggestionOutputSchema>;

export async function getPriceSuggestion(input: PriceSuggestionInput): Promise<PriceSuggestionOutput> {
  return priceSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'priceSuggestionPrompt',
  input: { schema: PriceSuggestionInputSchema },
  output: { schema: PriceSuggestionOutputSchema },
  prompt: `You are an expert restaurant business consultant specializing in the Mexican market.
Your task is to suggest a competitive and profitable retail price for a dish.

Dish Name: {{{dishName}}}
Cost of Ingredients: {{{cost}}} MXN

Analyze the cost and, based on your knowledge of the Mexican restaurant market, suggest a retail price.
The price should aim for a healthy profit margin (typically between 65-75% gross margin, meaning the cost should be 25-35% of the sale price), while also being competitive.
Round the final suggested price to the nearest whole number.
Provide ONLY the final numeric price in the specified JSON format.
`,
});

const priceSuggestionFlow = ai.defineFlow(
  {
    name: 'priceSuggestionFlow',
    inputSchema: PriceSuggestionInputSchema,
    outputSchema: PriceSuggestionOutputSchema,
  },
  async (input) => {
    if (input.cost <= 0) {
      throw new Error('Dish cost must be greater than zero to suggest a price.');
    }
    const { output } = await prompt(input);
    return output!;
  }
);
