
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
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, DocumentData, doc, getDoc } from 'firebase/firestore';


interface MenuItem {
  id: string;
  name: string;
  price: number;
  recipeId?: string;
}

interface Recipe {
  id: string;
  cost: number;
}

interface Order {
  id: string;
  status: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  createdAt: Timestamp;
}

const MenuOptimizationInsightsInputSchema = z.object({
  restaurantId: z.string(),
  dateRange: z.object({
    from: z.string().describe("The start date of the report range in ISO format."),
    to: z.string().describe("The end date of the report range in ISO format."),
  }),
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
  input: {schema: z.object({ salesData: z.string() })},
  output: {schema: MenuOptimizationInsightsOutputSchema},
  prompt: `You are a restaurant menu optimization expert. Analyze the provided sales data and provide recommendations in Spanish to improve profitability and customer satisfaction.

Sales Data:
{{{salesData}}}

Based on this data, provide a summary of your findings and a list of actionable recommendations. The recommendations should be specific, practical, and in Spanish, focusing on aspects like pricing, menu item placement, ingredients, and promotions.

Summary:

Recommendations:
`,
});

const menuOptimizationInsightsFlow = ai.defineFlow(
  {
    name: 'menuOptimizationInsightsFlow',
    inputSchema: MenuOptimizationInsightsInputSchema,
    outputSchema: MenuOptimizationInsightsOutputSchema,
  },
  async (input) => {
    const { restaurantId, dateRange } = input;
    
    // Determine if the restaurant is a demo or production one.
    const prodRestaurantRef = doc(db, 'restaurantes', restaurantId);
    const demoRestaurantRef = doc(db, 'restaurantes_demo', restaurantId);
    const prodSnap = await getDoc(prodRestaurantRef);
    
    const collectionName = prodSnap.exists() ? 'restaurantes' : 'restaurantes_demo';
    
    // 1. Fetch all menu items and recipes for cost calculation
    const menuItemsQuery = getDocs(collection(db, `${collectionName}/${restaurantId}/menuItems`));
    const recipesQuery = getDocs(collection(db, `${collectionName}/${restaurantId}/recipes`));
    const [menuItemsSnap, recipesSnap] = await Promise.all([menuItemsQuery, recipesQuery]);
    
    const menuItemsMap = new Map<string, MenuItem>(menuItemsSnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as MenuItem]));
    const recipesMap = new Map<string, Recipe>(recipesSnap.docs.map(d => [d.id, {id: d.id, ...d.data()} as Recipe]));

    // 2. Fetch all orders in the date range
    const startDate = new Date(dateRange.from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.to);
    endDate.setHours(23, 59, 59, 999);

    const ordersQuery = query(
        collection(db, `${collectionName}/${restaurantId}/orders`),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
    );
    const ordersSnap = await getDocs(ordersQuery);

    // 3. Process orders to create the sales data JSON
    const salesDataMap = new Map<string, { itemName: string; quantitySold: number; revenue: number; cost: number }>();

    ordersSnap.docs.forEach(orderDoc => {
        const order = orderDoc.data() as Order;
        if (order.status !== 'paid' && order.status !== 'served') {
            return; // Only include completed orders
        }
        order.items.forEach(item => {
            const menuItem = menuItemsMap.get(item.id);
            const recipe = menuItem?.recipeId ? recipesMap.get(menuItem.recipeId) : undefined;
            const itemCost = recipe?.cost || 0;

            const existing = salesDataMap.get(item.id) || {
                itemName: item.name,
                quantitySold: 0,
                revenue: 0,
                cost: 0
            };

            existing.quantitySold += item.quantity;
            existing.revenue += item.price * item.quantity;
            existing.cost += itemCost * item.quantity;

            salesDataMap.set(item.id, existing);
        });
    });

    const salesDataJson = JSON.stringify(Array.from(salesDataMap.values()));
    
    // 4. Call the prompt with the generated data
    const {output} = await prompt({ salesData: salesDataJson });
    return output!;
  }
);
