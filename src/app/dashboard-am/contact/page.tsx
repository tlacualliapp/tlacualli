
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Eye, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';


interface Incident {
    id: string;
    userName: string;
    userEmail: string;
    restaurantName: string;
    question: string;
    aiResponse: string;
    escalated: boolean;
    status: 'open' | 'closed' | 'escalated';
    createdAt: Timestamp;
    conversationHistory?: { role: 'user' | 'model'; content: string }[];
}

export default function ContactIncidentsPage() {
    const { t } = useTranslation();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "contacto"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const incidentsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Incident));
            setIncidents(incidentsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching incidents: ", error);
            setIsLoading(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load support incidents.' });
        });

        return () => unsubscribe();
    }, [toast]);

    const handleMarkAsResolved = async (incidentId: string) => {
        const incidentRef = doc(db, 'contacto', incidentId);
        try {
            await updateDoc(incidentRef, {
                status: 'closed',
                updatedAt: Timestamp.now(),
            });
            toast({ title: 'Incident Resolved', description: 'The incident has been marked as closed.' });
            setSelectedIncident(null);
        } catch (error) {
            console.error("Error resolving incident: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the incident status.' });
        }
    };
    
    const statusConfig = {
        open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
        closed: { label: 'Closed', color: 'bg-green-100 text-green-800' },
        escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800' },
    };

    return (
        <AppLayout>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Mail className="h-8 w-8" /> {t('Support Incidents')}
                    </CardTitle>
                    <CardDescription>{t('View and manage all user support interactions.')}</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Date')}</TableHead>
                                <TableHead>{t('Restaurant')}</TableHead>
                                <TableHead>{t('User')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead className="text-right">{t('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : incidents.length > 0 ? (
                                incidents.map((incident) => (
                                    <TableRow key={incident.id}>
                                        <TableCell>{incident.createdAt.toDate().toLocaleString()}</TableCell>
                                        <TableCell>{incident.restaurantName}</TableCell>
                                        <TableCell>{incident.userName}</TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig[incident.status]?.color}>
                                                {t(statusConfig[incident.status]?.label || incident.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedIncident(incident)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t('View')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {t('No incidents found.')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedIncident} onOpenChange={(isOpen) => !isOpen && setSelectedIncident(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('Incident Detail')}</DialogTitle>
                        <DialogDescription>
                            {t('Conversation between')} {selectedIncident?.userName} ({selectedIncident?.userEmail}) {t('from')} {selectedIncident?.restaurantName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ScrollArea className="h-72 w-full rounded-md border p-4 space-y-4">
                            {selectedIncident?.conversationHistory?.map((msg, index) => (
                                 <div key={index} className={cn("flex items-end gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                    {msg.role === 'model' && (
                                        <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                    )}
                                    <div className={cn("max-w-md p-3 rounded-lg", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                     {msg.role === 'user' && (
                                        <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>
                                    )}
                                </div>
                            ))}
                            <div className="flex items-end gap-3 justify-end">
                                <div className="max-w-md p-3 rounded-lg bg-primary text-primary-foreground">
                                    <p className="text-sm font-semibold mb-2">{t('Last message sent:')}</p>
                                    <p className="text-sm whitespace-pre-wrap">{selectedIncident?.question}</p>
                                </div>
                                <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>
                            </div>
                             <div className="flex items-end gap-3 justify-start">
                                <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                <div className="max-w-md p-3 rounded-lg bg-muted">
                                    <p className="text-sm font-semibold mb-2">{t('AI Final Response:')}</p>
                                    <p className="text-sm whitespace-pre-wrap">{selectedIncident?.aiResponse}</p>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                    {selectedIncident?.status !== 'closed' && (
                        <DialogFooter>
                            <Button onClick={() => handleMarkAsResolved(selectedIncident!.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('Mark as Resolved')}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
