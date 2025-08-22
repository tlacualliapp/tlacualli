
'use client';

import { useState } from 'react';
import { getMenuOptimizationInsights, MenuOptimizationInsightsOutput, MenuOptimizationInsightsInput } from '@/ai/flows/menu-optimization-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, ThumbsUp, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';


interface ReportFormProps {
    restaurantId: string;
    dateRange: { from: string; to: string; };
}

export function ReportForm({ restaurantId, dateRange }: ReportFormProps) {
  const [result, setResult] = useState<MenuOptimizationInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);

    if (!dateRange.from || !dateRange.to) {
        toast({
            variant: 'destructive',
            title: t('Date Range Required'),
            description: t('Please select a valid date range to generate the report.'),
        });
        setIsLoading(false);
        return;
    }

    try {
      const input: MenuOptimizationInsightsInput = {
        restaurantId,
        dateRange: {
            from: dateRange.from,
            to: dateRange.to,
        },
      };
      const insights = await getMenuOptimizationInsights(input);
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
      <Card className="flex flex-col items-center justify-center text-center">
        <CardHeader>
          <CardTitle>{t('Automated Menu Analysis')}</CardTitle>
          <CardDescription>
            {t('Click the button to automatically analyze sales data from the selected period and get AI-powered recommendations.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleGenerate} disabled={isLoading} className="bg-accent hover:bg-accent/90">
                {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Wand2 className="mr-2 h-4 w-4" />
                )}
                {t('Generate Insights')}
            </Button>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {isLoading && (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-semibold font-headline">{t('Generating your report...')}</p>
                    <p className="text-muted-foreground">{t('The AI is analyzing your data.')}</p>
                </CardContent>
            </Card>
        )}
        
        {result ? (
            <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{t('Report Generated Successfully!')}</AlertTitle>
              <AlertDescription>
                {t('Here are the insights based on your sales data.')}
              </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><ThumbsUp /> {t('Summary')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{result.summary}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><Wand2 /> {t('Recommendations')}</CardTitle>
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
                    <p className="text-lg font-semibold font-headline">{t('Your insights will appear here')}</p>
                    <p className="text-muted-foreground">{t('Generate a report to begin.')}</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
