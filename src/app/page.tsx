
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamsFlowStore } from '@/lib/store';
import { Kanban, MessageSquareText, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { cards, responses } = useTeamsFlowStore();

  const stats = [
    { title: 'Cards Ativos', value: cards.length, icon: Kanban, color: 'text-primary' },
    { title: 'Respostas Salvas', value: responses.length, icon: MessageSquareText, color: 'text-secondary' },
    { title: 'Produtividade', value: '+12%', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">Bem-vindo ao TeamsFlow</h1>
        <p className="text-muted-foreground">Otimize sua produtividade no Microsoft Teams Web.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (stat.icon && (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:border-primary transition-colors cursor-pointer group">
          <Link href="/kanban">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary">
                <Kanban className="w-5 h-5" />
                Acessar Kanban
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Transforme suas conversas em tarefas acionáveis e organize seu fluxo de trabalho.
              </p>
              <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-secondary transition-colors cursor-pointer group">
          <Link href="/responses">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-secondary">
                <MessageSquareText className="w-5 h-5" />
                Respostas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure gatilhos com '/' para responder mais rápido no Teams Web.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-secondary/20 text-secondary text-xs font-bold">/bomdia</span>
                <span className="px-2 py-1 rounded bg-secondary/20 text-secondary text-xs font-bold">/reuniao</span>
                <span className="px-2 py-1 rounded bg-secondary/20 text-secondary text-xs font-bold">/ok</span>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-6 p-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Sugestão de Prioridade via IA</h3>
            <p className="text-muted-foreground text-sm">
              Use nossa IA para analisar o conteúdo da conversa e sugerir automaticamente a prioridade do card no Kanban.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
