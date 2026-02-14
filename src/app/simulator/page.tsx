"use client";

import { useState, useEffect } from 'react';
import { useTeamsFlowStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Kanban, Send, Paperclip, Smile, MoreHorizontal, MessageSquareText } from 'lucide-react';
import { summarizeConversationForKanbanCard } from '@/ai/flows/summarize-conversation-for-kanban-card';
import { useToast } from '@/hooks/use-toast';

export default function SimulatorPage() {
  const { addCard, responses, isHydrated } = useTeamsFlowStore();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { id: '1', user: 'Carlos', text: 'Olá! Você conseguiu ver o relatório de vendas?', type: 'received' },
    { id: '2', user: 'Eu', text: 'Ainda não, vou verificar agora.', type: 'sent' },
    { id: '3', user: 'Carlos', text: 'Preciso disso para a reunião das 15h, por favor.', type: 'received' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const handleSend = () => {
    if (!message) return;
    
    // Check for quick responses
    const matchingResponse = responses.find(r => r.trigger === message);
    const finalMessage = matchingResponse ? matchingResponse.text : message;

    setChat([...chat, { id: Date.now().toString(), user: 'Eu', text: finalMessage, type: 'sent' }]);
    setMessage('');
  };

  const handleAddToKanban = async () => {
    const convoText = chat.map(m => `${m.user}: ${m.text}`).join('\n');
    setIsTyping(true);
    
    try {
      const summaryResult = await summarizeConversationForKanbanCard({ conversationContent: convoText });
      
      addCard({
        columnId: 'todo',
        title: `Tarefa de: Carlos`,
        content: summaryResult.summary,
        priority: 'Medium',
      });

      toast({
        title: "Card Criado!",
        description: "A conversa foi resumida pela IA e adicionada ao seu Kanban.",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar card",
        description: "Não foi possível resumir a conversa.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Simulador Teams Web</h1>
          <p className="text-muted-foreground italic">Veja como a extensão TeamsFlow se integra ao Teams.</p>
        </div>
        <Button 
          onClick={handleAddToKanban} 
          disabled={isTyping}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Kanban className="w-4 h-4 mr-2" />
          {isTyping ? 'Resumindo com IA...' : 'Adicionar Conversa ao Kanban'}
        </Button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-2xl border flex flex-col overflow-hidden">
        {/* Teams Header Mock */}
        <div className="h-16 border-b bg-muted/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://picsum.photos/seed/user1/40/40" />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold text-sm">Carlos Oliveira</h4>
              <p className="text-[10px] text-emerald-500 font-medium">Disponível</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
          {chat.map((m) => (
            <div key={m.id} className={`flex ${m.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl p-3 text-sm shadow-sm ${
                m.type === 'sent' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-white border rounded-tl-none'
              }`}>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl p-3 text-sm italic text-muted-foreground">
                Resumindo conversa...
              </div>
            </div>
          )}
        </div>

        {/* Input Area Mock */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input 
                placeholder="Tente digitar um gatilho como /ola (se cadastrado)..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Smile className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Paperclip className="w-4 h-4" /></Button>
              </div>
            </div>
            <Button 
              size="icon" 
              onClick={handleSend}
              className="bg-primary h-10 w-10 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-secondary/10 border-secondary/20">
        <CardContent className="p-4 text-sm flex gap-3 items-center">
          <div className="p-2 bg-secondary/20 rounded-lg text-secondary">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <p>
            <strong>Dica do Simulador:</strong> Tente cadastrar uma "Resposta Rápida" em <code className="bg-muted px-1 rounded">/responses</code> e depois digite o gatilho exatamente aqui no chat. Ao pressionar Enter, ele será substituído pelo texto completo!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
