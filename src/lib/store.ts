"use client";

import { useState, useEffect } from 'react';

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: number;
  teamsUrl?: string;
}

export interface QuickResponse {
  id: string;
  trigger: string;
  text: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'A Fazer', color: '#673AB7', order: 1 },
  { id: 'doing', name: 'Em Progresso', color: '#FF9800', order: 2 },
  { id: 'done', name: 'Concluído', color: '#4CAF50', order: 3 },
];

export function useTeamsFlowStore() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [responses, setResponses] = useState<QuickResponse[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedColumns = localStorage.getItem('tf_columns');
    const savedCards = localStorage.getItem('tf_cards');
    const savedResponses = localStorage.getItem('tf_responses');

    setColumns(savedColumns ? JSON.parse(savedColumns) : DEFAULT_COLUMNS);
    setCards(savedCards ? JSON.parse(savedCards) : []);
    setResponses(savedResponses ? JSON.parse(savedResponses) : []);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('tf_columns', JSON.stringify(columns));
    localStorage.setItem('tf_cards', JSON.stringify(cards));
    localStorage.setItem('tf_responses', JSON.stringify(responses));

    window.parent.postMessage({ 
      type: 'TEAMSFLOW_SYNC', 
      data: { columns, cards, responses } 
    }, "*");
  }, [columns, cards, responses, isHydrated]);

  const addColumn = (column: Omit<KanbanColumn, 'id' | 'order'>) => {
    const newCol: KanbanColumn = {
      ...column,
      id: Math.random().toString(36).substr(2, 9),
      order: columns.length + 1
    };
    setColumns([...columns, newCol]);
  };

  const deleteColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  const addCard = (card: Omit<KanbanCard, 'id' | 'createdAt'>) => {
    const newCard: KanbanCard = {
      ...card,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    setCards([...cards, newCard]);
  };

  const moveCard = (cardId: string, columnId: string) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, columnId } : c));
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const addResponse = (resp: Omit<QuickResponse, 'id'>) => {
    const newResp: QuickResponse = {
      ...resp,
      id: Math.random().toString(36).substr(2, 9)
    };
    setResponses([...responses, newResp]);
  };

  const deleteResponse = (id: string) => {
    setResponses(responses.filter(r => r.id !== id));
  };

  const clearAllData = () => {
    localStorage.clear();
    setColumns(DEFAULT_COLUMNS);
    setCards([]);
    setResponses([]);
  };

  return {
    columns,
    cards,
    responses,
    addColumn,
    deleteColumn,
    addCard,
    moveCard,
    deleteCard,
    addResponse,
    deleteResponse,
    clearAllData,
    isHydrated
  };
}