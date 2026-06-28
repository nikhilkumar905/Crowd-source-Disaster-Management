/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';

const NotificationsContext = createContext(null);

function makeNotification({ title, message, tone = 'info', payload }) {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title,
    message,
    tone, // 'info' | 'danger' | 'success'
    payload,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);

  const api = useMemo(
    () => ({
      items,
      unreadCount: items.filter((n) => !n.read).length,
      add(input) {
        const n = makeNotification(input);
        setItems((prev) => [n, ...prev].slice(0, 50));
        return n;
      },
      markAllRead() {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      },
      markRead(id) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      },
      clear() {
        setItems([]);
      }
    }),
    [items]
  );

  return <NotificationsContext.Provider value={api}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
