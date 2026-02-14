
"use client";

import { useState, useEffect } from 'react';

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  icon?: string;
  createdAt: number;
}

export interface QuickResponse {
  id: string;
  trigger: string;
  text: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'A Fazer', color: '#673AB7' },
  { id: 'doing', name: 'Em Progresso', color: '#FF9800' },
  { id: 'done', name: 'Concluído', color: '#4CAF50' },
];

export function useTeamsFlowStore() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [responses, setResponses] = useState<QuickResponse[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedColumns = localStorage.getItem('teamsflow_columns');
    const savedCards = localStorage.getItem('teamsflow_cards');
    const savedResponses = localStorage.getItem('teamsflow_responses');

    setColumns(savedColumns ? JSON.parse(savedColumns) : DEFAULT_COLUMNS);
    setCards(savedCards ? JSON.parse(savedCards) : []);
    setResponses(savedResponses ? JSON.parse(savedResponses) : []);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('teamsflow_columns', JSON.stringify(columns));
    }
  }, [columns, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('teamsflow_cards', JSON.stringify(cards));
    }
  }, [cards, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('teamsflow_responses', JSON.stringify(responses));
    }
  }, [responses, isHydrated]);

  const addColumn = (column: Omit<KanbanColumn, 'id'>) => {
    setColumns([...columns, { ...column, id: Date.now().toString() }]);
  };

  const updateColumn = (id: string, updates: Partial<KanbanColumn>) => {
    setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
    setCards(cards.filter(c => c.columnId !== id));
  };

  const addCard = (card: Omit<KanbanCard, 'id' | 'createdAt'>) => {
    setCards([...cards, { ...card, id: Date.now().toString(), createdAt: Date.now() }]);
  };

  const moveCard = (cardId: string, columnId: string) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, columnId } : c));
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const addResponse = (resp: Omit<QuickResponse, 'id'>) => {
    setResponses([...responses, { ...resp, id: Date.now().toString() }]);
  };

  const deleteResponse = (id: string) => {
    setResponses(responses.filter(r => r.id !== id));
  };

  return {
    columns,
    cards,
    responses,
    addColumn,
    updateColumn,
    deleteColumn,
    addCard,
    moveCard,
    deleteCard,
    addResponse,
    deleteResponse,
    isHydrated
  };
}
