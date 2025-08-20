
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getMenuOptimizationInsights, MenuOptimizationInsightsOutput } from '@/ai/flows/menu-optimization-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Wand2, ThumbsUp, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  salesData: z.string().min(1, 'Sales data cannot be empty.'),
});

type FormValues = z.infer<typeof formSchema>;

const exampleData = JSON.stringify([
    {"itemName": "Volcano Tacos", "quantitySold": 120, "revenue": 1500, "cost": 480},
    {"itemName": "Aztec Burger", "quantitySold": 95, "revenue": 1425, "cost": 427.5},
    {"itemName": "Quinoa Sun Salad", "quantitySold": 150, "revenue": 1650, "cost": 500},
    {"itemName": "Churros & Chocolate", "quantitySold": 80, "revenue": 680, "cost": 200},
    {"itemName": "Classic Margarita", "quantitySold": 200, "revenue": 2400, "cost": 600}
], null, 2);

export function ReportForm() {
  const [result, setResult] = useState<MenuOptimizationInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesData: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const insights = await getMenuOptimizationInsights({ salesData: data.salesData });
      setResult(insights);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error generating report',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Input Sales Data</CardTitle>
          <CardDescription>
            Paste your sales data in JSON format below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="salesData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Data (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., [{"itemName": "Burger", "quantitySold": 100, ...}]'
                        className="min-h-[300px] font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" type="button" onClick={() => form.setValue('salesData', exampleData)}>
                    Load Example Data
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Insights
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {isLoading && (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-semibold font-headline">Generating your report...</p>
                    <p className="text-muted-foreground">The AI is analyzing your data.</p>
                </CardContent>
            </Card>
        )}
        
        {result ? (
            <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Report Generated Successfully!</AlertTitle>
              <AlertDescription>
                Here are the insights based on your sales data.
              </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><ThumbsUp /> Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{result.summary}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><Wand2 /> Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <Badge variant="secondary" className="mt-1">{index + 1}</Badge>
                            <span className="text-muted-foreground">{rec}</span>
                        </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            </>
        ) : !isLoading && (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed">
                <CardContent className="text-center">
                    <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold font-headline">Your insights will appear here</p>
                    <p className="text-muted-foreground">Enter your data and generate a report to begin.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
