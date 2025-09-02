
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Eye, CheckCircle, Trash2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendSupportReply } from '@/app/actions/support';


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
    const [isClient, setIsClient] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const { toast } = useToast();
    const [adminReply, setAdminReply] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);


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
    
    const handleDelete = async (incidentId: string) => {
        try {
            await deleteDoc(doc(db, "contacto", incidentId));
            toast({
                title: 'Incident Deleted',
                description: 'The conversation has been permanently deleted.',
            });
        } catch (error) {
            console.error("Error deleting incident: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the incident.' });
        }
    };
    
    const handleSendReply = async () => {
        if (!selectedIncident || !adminReply.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please write a reply.'});
            return;
        }
        setIsReplying(true);
        try {
            await sendSupportReply({
                incidentId: selectedIncident.id,
                userEmail: selectedIncident.userEmail,
                userName: selectedIncident.userName,
                originalQuestion: selectedIncident.question,
                adminReply: adminReply,
            });

            toast({ title: 'Reply Sent', description: 'The reply has been sent to the user.' });
            setSelectedIncident(null);
            setAdminReply('');
        } catch (error) {
            console.error("Error sending reply:", error);
            toast({ variant: 'destructive', title: 'Error', description: `Failed to send reply. ${(error as Error).message}` });
        } finally {
            setIsReplying(false);
        }
    };


    const statusConfig = {
        open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
        closed: { label: 'Atendido', color: 'bg-green-100 text-green-800' },
        escalated: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    };

    if (!isClient) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }


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
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedIncident(incident)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t('View')}
                                            </Button>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('Delete')}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('This action cannot be undone. This will permanently delete the conversation.')}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(incident.id)} className="bg-destructive hover:bg-destructive/90">
                                                            {t('Yes, delete')}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
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
                        </ScrollArea>
                    </div>
                    {selectedIncident?.status === 'escalated' && (
                        <div className="py-4 border-t">
                            <Label htmlFor="admin-reply" className="font-semibold">{t('Respond to User')}</Label>
                            <Textarea 
                                id="admin-reply"
                                className="mt-2"
                                rows={5}
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                placeholder={t('Write your response here...')}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        {selectedIncident?.status === 'escalated' ? (
                             <Button onClick={handleSendReply} disabled={isReplying}>
                                {isReplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Send className="mr-2 h-4 w-4" />
                                {t('Send Reply')}
                            </Button>
                        ) : selectedIncident?.status === 'closed' ? (
                             <Button disabled>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('Case Attended')}
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
