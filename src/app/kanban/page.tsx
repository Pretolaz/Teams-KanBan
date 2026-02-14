
"use client";

import { useState } from 'react';
import { useTeamsFlowStore, KanbanCard } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, Trash2, ArrowRight, ArrowLeft, BrainCircuit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { aiPrioritizeKanbanTask } from '@/ai/flows/ai-prioritize-kanban-task';
import { useToast } from '@/hooks/use-toast';

export default function KanbanPage() {
  const { columns, cards, addColumn, deleteColumn, moveCard, deleteCard, isHydrated } = useTeamsFlowStore();
  const [newColName, setNewColName] = useState('');
  const { toast } = useToast();

  if (!isHydrated) return null;

  const handleAddColumn = () => {
    if (newColName) {
      addColumn({ name: newColName, color: '#673AB7' });
      setNewColName('');
    }
  };

  const handleAIPrioritize = async (card: KanbanCard) => {
    try {
      const result = await aiPrioritizeKanbanTask({
        conversationContent: card.content,
        recentInteractionCount: 5 // Mock value
      });
      toast({
        title: "Sugestão da IA",
        description: `Prioridade sugerida: ${result.priority}. Motivo: ${result.reasoning}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao consultar a IA para priorização.",
        variant: "destructive"
      });
    }
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
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Board Kanban</h1>
          <p className="text-muted-foreground">Gerencie suas tarefas derivadas do Teams.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Coluna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Coluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input 
                placeholder="Nome da coluna" 
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
              />
              <Button onClick={handleAddColumn} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                  <h3 className="font-bold text-lg">{column.name}</h3>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {cards.filter(c => c.columnId === column.id).length}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => deleteColumn(column.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover Coluna
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 bg-muted/40 rounded-xl p-3 space-y-3 min-h-[400px]">
                {cards
                  .filter(c => c.columnId === column.id)
                  .map((card) => (
                    <Card key={card.id} className="group shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="p-3 pb-0 space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge className={getPriorityColor(card.priority)}>
                            {card.priority}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleAIPrioritize(card)}
                            >
                              <BrainCircuit className="w-4 h-4 text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteCard(card.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-sm font-bold line-clamp-2">{card.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2 text-xs text-muted-foreground">
                        <p className="line-clamp-3 mb-4">{card.content}</p>
                        <div className="flex justify-between items-center mt-auto border-t pt-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            disabled={columns.indexOf(column) === 0}
                            onClick={() => moveCard(card.id, columns[columns.indexOf(column) - 1].id)}
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </Button>
                          <span className="text-[10px]">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            disabled={columns.indexOf(column) === columns.length - 1}
                            onClick={() => moveCard(card.id, columns[columns.indexOf(column) + 1].id)}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
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
