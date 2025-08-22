
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Item {
  id: string;
  name: string;
  currentStock: number;
}

interface MovementFormProps {
  restaurantId: string;
  item: Item;
  type: 'entry' | 'exit' | 'adjustment';
  onSuccess?: () => void;
}

export function MovementForm({ restaurantId, item, type, onSuccess }: MovementFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [cost, setCost] = useState(0);
  const { t } = useTranslation();
  const [user] = useAuthState(auth);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (quantity <= 0) {
        toast({ variant: "destructive", title: t("Invalid Quantity"), description: t("Quantity must be greater than zero.") });
        return;
    }
    setIsLoading(true);

    try {
        const itemRef = doc(db, `restaurantes/${restaurantId}/inventoryItems`, item.id);
        const movementRef = collection(db, `restaurantes/${restaurantId}/inventoryMovements`);

        await runTransaction(db, async (transaction) => {
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists()) {
                throw new Error("Item does not exist!");
            }

            const currentStock = itemDoc.data().currentStock || 0;
            let newStock;
            
            if (type === 'entry') {
                newStock = currentStock + quantity;
            } else if (type === 'exit') {
                newStock = currentStock - quantity;
                if (newStock < 0) {
                    throw new Error("Cannot have negative stock.");
                }
            } else { // adjustment
                newStock = quantity;
            }

            transaction.update(itemRef, { currentStock: newStock });

            transaction.set(doc(movementRef), {
                itemId: item.id,
                itemName: item.name,
                type: type,
                quantity: quantity,
                cost: type === 'entry' ? cost : 0,
                previousStock: currentStock,
                newStock: newStock,
                createdAt: serverTimestamp(),
                userId: user?.uid || 'unknown',
                userEmail: user?.email || 'unknown',
            });
        });

      toast({ title: t("Movement Registered"), description: t("The inventory has been updated.") });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error processing movement:", error);
      toast({ variant: "destructive", title: t("Error"), description: t(error.message) || t("Could not register the movement.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">{t('Quantity')} ({t(type)})</Label>
        <Input 
          id="quantity" 
          name="quantity" 
          type="number" 
          value={quantity} 
          onChange={(e) => setQuantity(Number(e.target.value))} 
          required 
        />
      </div>
      
      {type === 'entry' && (
         <div className="space-y-2">
            <Label htmlFor="cost">{t('Total Cost')}</Label>
            <Input 
              id="cost" 
              name="cost" 
              type="number" 
              step="0.01" 
              value={cost} 
              onChange={(e) => setCost(Number(e.target.value))} 
            />
         </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('Save Movement')}
        </Button>
      </div>
    </form>
  );
}
