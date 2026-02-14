
"use client";

import { useTeamsFlowStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Palette, Shield, Zap, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const { isHydrated, clearAllData } = useTeamsFlowStore();

  if (!isHydrated) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência com o TeamsFlow.</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Sincronização Local</AlertTitle>
        <AlertDescription className="text-blue-700">
          Para que as respostas apareçam no Teams, mantenha esta aba aberta enquanto configura. A extensão captura os dados automaticamente do seu navegador.
        </AlertDescription>
      </Alert>

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
              <Shield className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-lg">Privacidade e Dados</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
              <p className="text-sm text-emerald-800">
                <strong>Privacidade Total:</strong> Seus dados são salvos apenas no seu computador (LocalStorage e Chrome Storage). Nenhuma conversa ou configuração é enviada para servidores externos.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="text-destructive border-destructive hover:bg-destructive hover:text-white"
              onClick={clearAllData}
            >
              Limpar Todos os Dados Locais
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
