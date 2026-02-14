
"use client";

import { useState } from 'react';
import { useTeamsFlowStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquareText, Plus, Trash2, Command } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResponsesPage() {
  const { responses, addResponse, deleteResponse, isHydrated } = useTeamsFlowStore();
  const [trigger, setTrigger] = useState('');
  const [text, setText] = useState('');
  const { toast } = useToast();

  if (!isHydrated) return null;

  const handleAdd = () => {
    if (!trigger.startsWith('/')) {
      toast({
        title: "Erro no gatilho",
        description: "O gatilho deve começar com '/'",
        variant: "destructive"
      });
      return;
    }
    if (trigger && text) {
      addResponse({ trigger, text });
      setTrigger('');
      setText('');
      toast({
        title: "Gatilho Adicionado",
        description: `O gatilho ${trigger} foi salvo com sucesso.`,
      });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">Respostas Rápidas</h1>
        <p className="text-muted-foreground">Cadastre atalhos para respostas frequentes no Teams Web.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Novo Gatilho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Gatilho (ex: /ola)</label>
              <Input 
                placeholder="/seu-comando" 
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Texto de Resposta</label>
            <Textarea 
              placeholder="Digite o texto que será inserido..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <Button onClick={handleAdd} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Resposta
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {responses.map((resp) => (
          <Card key={resp.id} className="relative group overflow-hidden border-l-4 border-l-secondary">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-primary font-mono text-sm">{resp.trigger}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteResponse(resp.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 italic">
                "{resp.text}"
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {responses.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl border-muted">
          <Command className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhuma resposta cadastrada</h3>
          <p className="text-sm text-muted-foreground">Comece adicionando seu primeiro gatilho acima.</p>
        </div>
      )}
    </div>
  );
}
