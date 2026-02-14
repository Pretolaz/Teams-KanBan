
"use client";

import { useTeamsFlowStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Palette, Shield, Zap, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { isHydrated } = useTeamsFlowStore();

  if (!isHydrated) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência com o TeamsFlow.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Interface e Estilo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">Ajusta a interface para ambientes com pouca luz.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cores Vibrantes no Kanban</Label>
                <p className="text-sm text-muted-foreground">Usa cores mais saturadas para destacar colunas.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary" />
              <CardTitle className="text-lg">Funcionalidades Inteligentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sugestão Automática de Prioridade</Label>
                <p className="text-sm text-muted-foreground">Usa GenAI para definir prioridade ao criar cards.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-resumo de Conversas</Label>
                <p className="text-sm text-muted-foreground">Gera títulos concisos para cards automaticamente.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-lg">Privacidade e Dados</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
              <p className="text-sm text-emerald-800">
                <strong>Nota de Segurança:</strong> Todos os seus dados (Kanban e Gatilhos) são armazenados localmente no seu navegador. Nenhuma informação de conversa é enviada para nossos servidores, exceto quando você solicita explicitamente o processamento de IA.
              </p>
            </div>
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-white">
              Limpar Todos os Dados Locais
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
