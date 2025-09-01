
'use client';

import { useState } from 'react';
import { getRecipeSuggestions, RecipeSuggestionOutput } from '@/ai/flows/recipe-suggestions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Sparkles, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

interface RecipeSuggesterProps {
  restaurantId: string;
  userPlan: 'demo' | 'esencial' | 'pro' | 'ilimitado';
}

interface Ingredient {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
}

export function RecipeSuggester({ restaurantId, userPlan }: RecipeSuggesterProps) {
  const [suggestions, setSuggestions] = useState<RecipeSuggestionOutput['suggestions']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';

  const handleGenerate = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await getRecipeSuggestions({ restaurantId, userPlan });
      setSuggestions(result.suggestions);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Error generating suggestions'),
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveRecipe = async (recipe: RecipeSuggestionOutput['suggestions'][0]) => {
    setIsSaving(recipe.recipeName);
    try {
        let totalCost = 0;
        const ingredientsWithCost: Ingredient[] = [];

        for (const suggestedIng of recipe.ingredients) {
            const itemRef = doc(db, `${collectionName}/${restaurantId}/inventoryItems`, suggestedIng.itemId);
            const itemSnap = await getDoc(itemRef);

            let itemCost = 0;
            if (itemSnap.exists()) {
                itemCost = itemSnap.data().averageCost || 0;
            }
            
            totalCost += itemCost * suggestedIng.quantity;
            ingredientsWithCost.push({
                ...suggestedIng,
                cost: itemCost,
            });
        }

        const recipeData = {
            name: recipe.recipeName,
            ingredients: ingredientsWithCost,
            cost: totalCost,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: 'AI',
        };

        await addDoc(collection(db, `${collectionName}/${restaurantId}/recipes`), recipeData);

        toast({
            title: t('Recipe Saved!'),
            description: t('The recipe "{{recipeName}}" has been added to your collection.', { recipeName: recipe.recipeName }),
        });
        
        // Remove the saved suggestion from the list
        setSuggestions(prev => prev.filter(s => s.recipeName !== recipe.recipeName));

    } catch (error) {
        console.error("Error saving recipe:", error);
        toast({ variant: 'destructive', title: t('Save Error'), description: t('Could not save the recipe.') });
    } finally {
        setIsSaving(null);
    }
  };


  return (
    <>
      <Button onClick={handleGenerate} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        <span className="ml-2">{t('Generate Ideas')}</span>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 /> {t('AI Recipe Suggestions')}</DialogTitle>
            <DialogDescription>{t('Here are some recipe ideas based on your inventory. You can save your favorites directly.')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 overflow-y-auto">
            {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{suggestion.recipeName}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <p className="text-sm font-semibold">{t('Ingredients')}:</p>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {suggestion.ingredients.map((ing, i) => (
                                    <li key={i}>{ing.quantity} {t(ing.unit)} {ing.itemName}</li>
                                ))}
                            </ul>
                        </CardContent>
                        <div className="p-4 pt-0">
                            <Button className="w-full" onClick={() => handleSaveRecipe(suggestion)} disabled={isSaving === suggestion.recipeName}>
                                {isSaving === suggestion.recipeName ? <Loader2 className="animate-spin" /> : <Save />}
                                <span className="ml-2">{t('Save Recipe')}</span>
                            </Button>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center text-muted-foreground p-8">
                     <Info className="mx-auto h-8 w-8 mb-4" />
                    {t('No more suggestions. You can close this window or generate new ones.')}
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
