"use client";

import { useState, useEffect } from 'react';
import { useTeamsFlowStore, KanbanCard } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, Trash2, ArrowRight, ArrowLeft, BrainCircuit, ExternalLink, Capture } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

export default function KanbanPage() {
  const { columns, cards, addCard, deleteColumn, moveCard, deleteCard, isHydrated } = useTeamsFlowStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isExtensionMode = searchParams.get('mode') === 'extension';

  useEffect(() => {
    const handleContext = (event: MessageEvent) => {
      if (event.data.type === 'TEAMSFLOW_CONTEXT_RESPONSE') {
        addCard({
          columnId: 'todo',
          title: `Conversa: ${event.data.context.title}`,
          content: 'Resumo da conversa pendente...',
          priority: 'Medium',
          teamsUrl: event.data.context.url
        });
        setIsCapturing(false);
        toast({ title: "Card Criado!", description: "Conversa capturada do Teams." });
      }
    };
    window.addEventListener('message', handleContext);
    return () => window.removeEventListener('message', handleContext);
  }, [addCard, toast]);

  if (!isHydrated) return null;

  const handleCaptureConversation = () => {
    setIsCapturing(true);
    window.parent.postMessage({ type: 'TEAMSFLOW_GET_CONTEXT' }, '*');
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-destructive text-destructive-foreground';
      case 'Medium': return 'bg-orange-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <div className={`h-full flex flex-col space-y-4 ${isExtensionMode ? 'p-4 bg-white' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-primary">Board Kanban</h1>
          {isExtensionMode && (
             <Button 
                size="sm" 
                onClick={handleCaptureConversation} 
                disabled={isCapturing}
                className="mt-2 bg-accent text-accent-foreground"
              >
               <Plus className="w-3 h-3 mr-1" /> Capturar Chat
             </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full">
          {columns.map((column) => (
            <div key={column.id} className="w-72 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">{column.name}</h3>
                  <Badge variant="secondary" className="text-[10px] h-4">
                    {cards.filter(c => c.columnId === column.id).length}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 bg-muted/20 rounded-lg p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
                {cards
                  .filter(c => c.columnId === column.id)
                  .map((card) => (
                    <Card key={card.id} className="p-2 shadow-sm border-l-4" style={{ borderLeftColor: column.color }}>
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={`${getPriorityColor(card.priority)} text-[9px] px-1 h-4`}>
                          {card.priority}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteCard(card.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <h4 className="text-xs font-bold leading-tight">{card.title}</h4>
                      {card.teamsUrl && (
                        <a 
                          href={card.teamsUrl} 
                          target="_blank" 
                          className="flex items-center gap-1 text-[10px] text-primary mt-2 hover:underline"
                        >
                          <ExternalLink className="w-2 h-2" /> Ir para conversa
                        </a>
                      )}
                      <div className="flex justify-between mt-3 pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          disabled={columns.indexOf(column) === 0}
                          onClick={() => moveCard(card.id, columns[columns.indexOf(column) - 1].id)}
                        >
                          <ArrowLeft className="w-2 h-2" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          disabled={columns.indexOf(column) === columns.length - 1}
                          onClick={() => moveCard(card.id, columns[columns.indexOf(column) + 1].id)}
                        >
                          <ArrowRight className="w-2 h-2" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}