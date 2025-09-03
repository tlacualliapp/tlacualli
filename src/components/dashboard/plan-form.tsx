
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Plan } from '@/app/dashboard-am/plans/page';

interface PlanFormProps {
  onSuccess?: () => void;
  planToEdit?: Plan | null;
}

export function PlanForm({ onSuccess, planToEdit }: PlanFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const isEditMode = !!planToEdit;

    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        maxTables: 0,
        maxOrders: 0,
    });

    useEffect(() => {
        if (isEditMode && planToEdit) {
            setFormData({
                name: planToEdit.name || '',
                price: planToEdit.price || 0,
                maxTables: planToEdit.maxTables || 0,
                maxOrders: planToEdit.maxOrders || 0,
            });
        } else {
             setFormData({ name: '', price: 0, maxTables: 0, maxOrders: 0 });
        }
    }, [planToEdit, isEditMode]);

     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isEditMode && planToEdit) {
                const planRef = doc(db, 'planes', planToEdit.id);
                await updateDoc(planRef, { ...formData, updatedAt: serverTimestamp() });
                toast({ title: t("Update Successful"), description: t("The plan has been updated.") });
            } else {
                await addDoc(collection(db, 'planes'), { ...formData, createdAt: serverTimestamp() });
                toast({ title: t("Plan Created"), description: t("The new plan has been created successfully.") });
            }
            onSuccess?.();
        } catch (error) {
            console.error("Error saving plan:", error);
            toast({ variant: "destructive", title: t("Save Error"), description: t("Could not save the plan information.") });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">{t('Plan Name')}</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('e.g., Esencial')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('Price (MXN)')}</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="maxTables">{t('Max Tables')}</Label>
                    <Input id="maxTables" name="maxTables" type="number" value={formData.maxTables} onChange={handleInputChange} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="maxOrders">{t('Max Orders/Month')}</Label>
                <Input id="maxOrders" name="maxOrders" type="number" value={formData.maxOrders} onChange={handleInputChange} required />
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isEditMode ? t('Update Plan') : t('Save Plan')}
                </Button>
            </div>
        </form>
    );
}
