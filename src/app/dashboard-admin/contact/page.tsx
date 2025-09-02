
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Send, User, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getCurrentUserData } from '@/lib/users';
import { getSupportResponse, SupportAgentInput } from '@/ai/flows/support-agent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface Restaurant {
  id: string;
  restaurantName: string;
}

interface UserInfo {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const [user, loading] = useAuthState(auth);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        const userData = await getCurrentUserData();
        if (userData && userData.restauranteId) {
            // Fetch User Info
            const userQuery = query(collection(db, "usuarios"), where("uid", "==", user.uid));
            const userSnapshot = await getDocs(userQuery);
            if (!userSnapshot.empty) {
                const doc = userSnapshot.docs[0];
                setUserInfo({ id: doc.id, ...doc.data() } as UserInfo);
            }

            // Fetch Restaurant Info
            const collectionName = userData.plan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
            const restaurantRef = doc(db, collectionName, userData.restauranteId);
            const restaurantSnap = await getDoc(restaurantRef);
            if (restaurantSnap.exists()) {
                setRestaurant({ id: restaurantSnap.id, ...restaurantSnap.data() } as Restaurant);
            }
        }
        setIsLoading(false);
      };
      fetchInitialData();
    }
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !userInfo || !restaurant) return;

    const userMessage: Message = { role: 'user', content: message };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);

    try {
        const input: SupportAgentInput = {
            userId: user.uid,
            userName: `${userInfo.nombre} ${userInfo.apellidos}`,
            userEmail: userInfo.email,
            restaurantId: restaurant.id,
            restaurantName: restaurant.restaurantName,
            message: message,
            conversationHistory: conversation
        };
        
        const result = await getSupportResponse(input);
        const aiMessage: Message = { role: 'model', content: result.aiResponse };
        setConversation(prev => [...prev, aiMessage]);

        if(result.escalated) {
             toast({
                title: t('Case Escalated'),
                description: t('Our support team will contact you shortly by email.'),
                duration: 5000,
            });
        }

    } catch (error) {
        console.error("Error contacting support agent:", error);
        const errorMessage: Message = { role: 'model', content: t("Sorry, I'm having trouble connecting. Please try again later.") };
        setConversation(prev => [...prev, errorMessage]);
    } finally {
        setIsSending(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [conversation]);

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <Card className="mb-6 bg-card/65 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Mail className="h-8 w-8" /> {t('Contact & Support')}
          </CardTitle>
          <CardDescription>{t("Have a question? Our AI assistant can help you, or escalate it to our team.")}</CardDescription>
        </CardHeader>
      </Card>
      
      <Card className="h-[calc(100vh-22rem)] flex flex-col">
        <CardContent className="p-0 flex-grow flex flex-col">
            <ScrollArea className="flex-grow p-6 space-y-4" ref={scrollAreaRef as any}>
                {conversation.map((msg, index) => (
                    <div key={index} className={cn("flex items-end gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.role === 'model' && (
                            <Avatar>
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn("max-w-md p-3 rounded-lg", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                         {msg.role === 'user' && (
                            <Avatar>
                                <AvatarFallback>{userInfo?.nombre?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                {isSending && (
                    <div className="flex items-end gap-3 justify-start">
                         <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                         <div className="max-w-md p-3 rounded-lg bg-muted flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                         </div>
                    </div>
                )}
            </ScrollArea>
             <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-4">
                <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('Type your question here...')}
                    disabled={isSending}
                />
                <Button type="submit" disabled={isSending || !message.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </CardContent>
      </Card>

    </AdminLayout>
  );
}
