
"use client";

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

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
  const db = useFirestore();
  const { user } = useUser();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [responses, setResponses] = useState<QuickResponse[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync Columns
  useEffect(() => {
    if (!db || !user) {
      setColumns(DEFAULT_COLUMNS);
      setIsHydrated(true);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'columns'), orderBy('order'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as KanbanColumn));
      setColumns(data.length > 0 ? data : DEFAULT_COLUMNS);
      setIsHydrated(true);
    });
  }, [db, user]);

  // Sync Cards
  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, 'users', user.uid, 'cards'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setCards(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as KanbanCard)));
    });
  }, [db, user]);

  // Sync Responses
  useEffect(() => {
    if (!db || !user) return;
    const q = collection(db, 'users', user.uid, 'responses');
    return onSnapshot(q, (snapshot) => {
      setResponses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as QuickResponse)));
    });
  }, [db, user]);

  const addColumn = async (column: Omit<KanbanColumn, 'id' | 'order'>) => {
    if (!db || !user) return;
    const newOrder = columns.length + 1;
    await addDoc(collection(db, 'users', user.uid, 'columns'), { ...column, order: newOrder });
  };

  const deleteColumn = async (id: string) => {
    if (!db || !user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'columns', id));
  };

  const addCard = async (card: Omit<KanbanCard, 'id' | 'createdAt'>) => {
    if (!db || !user) return;
    await addDoc(collection(db, 'users', user.uid, 'cards'), { 
      ...card, 
      createdAt: Date.now() 
    });
  };

  const moveCard = async (cardId: string, columnId: string) => {
    if (!db || !user) return;
    await updateDoc(doc(db, 'users', user.uid, 'cards', cardId), { columnId });
  };

  const deleteCard = async (id: string) => {
    if (!db || !user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'cards', id));
  };

  const addResponse = async (resp: Omit<QuickResponse, 'id'>) => {
    if (!db || !user) return;
    await addDoc(collection(db, 'users', user.uid, 'responses'), resp);
  };

  const deleteResponse = async (id: string) => {
    if (!db || !user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'responses', id));
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
    isHydrated
  };
}
