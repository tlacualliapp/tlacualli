
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CalendarIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Plan } from '@/app/dashboard-am/plans/page';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlanFormProps {
  onSuccess?: () => void;
  // Permitir que `startDate` y `description` existan en el objeto del plan
  planToEdit?: (Plan & { startDate?: Timestamp, description?: string }) | null;
}

export function PlanForm({ onSuccess, planToEdit }: PlanFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const isEditMode = !!planToEdit;

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        maxTables: 0,
        maxOrders: 0,
        description: '', // Añadir description al estado
    });
    const [startDate, setStartDate] = useState<Date | undefined>();

    useEffect(() => {
        if (isEditMode && planToEdit) {
            setFormData({
                name: planToEdit.name || '',
                price: planToEdit.price || 0,
                maxTables: planToEdit.maxTables || 0,
                maxOrders: planToEdit.maxOrders || 0,
                description: planToEdit.description || '', // Cargar description
            });
            if (planToEdit.startDate) {
                setStartDate(planToEdit.startDate.toDate());
            } else {
                setStartDate(undefined);
            }
        } else {
             setFormData({ name: '', price: 0, maxTables: 0, maxOrders: 0, description: '' });
             setStartDate(undefined);
        }
    }, [planToEdit, isEditMode]);

    // Actualizar para manejar también Textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'name' || name === 'description' ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const dataToSave = {
            ...formData,
            startDate: startDate,
        };

        try {
            if (isEditMode && planToEdit) {
                const planRef = doc(db, 'planes', planToEdit.id);
                await updateDoc(planRef, { ...dataToSave, updatedAt: serverTimestamp() });
                toast({ title: t("Update Successful"), description: t("The plan has been updated.") });
            } else {
                await addDoc(collection(db, 'planes'), { ...dataToSave, createdAt: serverTimestamp() });
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
                <Label htmlFor="name">{isClient ? t('Plan Name') : 'Plan Name'}</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={isClient ? t('e.g., Esencial') : 'e.g., Esencial'} required />
            </div>

            {/* Campo de Descripción */}
            <div className="space-y-2">
                <Label htmlFor="description">{isClient ? t('Description') : 'Description'}</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={isClient ? t('Enter a brief description of the plan.') : 'Enter a brief description of the plan.'}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="startDate">{isClient ? t('Start Date') : 'Start Date'}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>{isClient ? t('Pick a date') : 'Pick a date'}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{isClient ? t('Price (MXN)') : 'Price (MXN)'}</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="maxTables">{isClient ? t('Max Tables') : 'Max Tables'}</Label>
                    <Input id="maxTables" name="maxTables" type="number" value={formData.maxTables} onChange={handleInputChange} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="maxOrders">{isClient ? t('Max Orders/Month') : 'Max Orders/Month'}</Label>
                <Input id="maxOrders" name="maxOrders" type="number" value={formData.maxOrders} onChange={handleInputChange} required />
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isClient ? (isEditMode ? t('Update Plan') : t('Save Plan')) : '...'}
                </Button>
            </div>
        </form>
    );
}
