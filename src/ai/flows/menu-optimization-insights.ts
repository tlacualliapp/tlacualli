'use server';

/**
 * @fileOverview Provides menu optimization insights based on sales data.
 *
 * - getMenuOptimizationInsights - A function that generates menu optimization reports.
 * - MenuOptimizationInsightsInput - The input type for the getMenuOptimizationInsights function.
 * - MenuOptimizationInsightsOutput - The return type for the getMenuOptimizationInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MenuOptimizationInsightsInputSchema = z.object({
  salesData: z
    .string()
    .describe(
      'Sales data in JSON format.  Each entry should include item name, quantity sold, revenue, and cost.  Example:  `[{"itemName": "Burger", "quantitySold": 100, "revenue": 500, "cost": 200}, {"itemName": "Fries", "quantitySold": 150, "revenue": 300, "cost": 100}]`'
    ),
});
export type MenuOptimizationInsightsInput = z.infer<
  typeof MenuOptimizationInsightsInputSchema
>;

const MenuOptimizationInsightsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of menu optimization recommendations based on the sales data.'
    ),
  recommendations: z
    .array(z.string())
    .describe(
      'A list of specific and actionable recommendations for menu optimization.'
    ),
});
export type MenuOptimizationInsightsOutput = z.infer<
  typeof MenuOptimizationInsightsOutputSchema
>;

export async function getMenuOptimizationInsights(
  input: MenuOptimizationInsightsInput
): Promise<MenuOptimizationInsightsOutput> {
  return menuOptimizationInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'menuOptimizationInsightsPrompt',
  input: {schema: MenuOptimizationInsightsInputSchema},
  output: {schema: MenuOptimizationInsightsOutputSchema},
  prompt: `You are a restaurant menu optimization expert. Analyze the provided sales data and provide recommendations to improve profitability and customer satisfaction.

Sales Data:
{{{salesData}}}

Based on this data, provide a summary of your findings and a list of actionable recommendations. The recommendations should be specific and practical, focusing on aspects like pricing, menu item placement, ingredients, and promotions.

Summary:

Recommendations:
`, // Ensure the model outputs a Summary and Recommendations section.
});

const menuOptimizationInsightsFlow = ai.defineFlow(
  {
    name: 'menuOptimizationInsightsFlow',
    inputSchema: MenuOptimizationInsightsInputSchema,
    outputSchema: MenuOptimizationInsightsOutputSchema,
  },
  async input => {
    try {
      // Optional:  Parse and validate salesData before passing to the prompt.  Helpful for debugging.
      JSON.parse(input.salesData);
    } catch (e) {
      throw new Error(
        'Invalid JSON format in salesData.  Please provide valid JSON.'
      );
    }

    const {output} = await prompt(input);
    return output!;
  }
);
