import type { UIMessage } from "ai";

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const STORAGE_KEY = "ergopomodoro-threads";

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function createThread(title = "Nova conversa"): ChatThread {
  return {
    id: crypto.randomUUID(),
    title,
    updatedAt: Date.now(),
    messages: [],
  };
}

export function upsertThread(thread: ChatThread) {
  const threads = loadThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) threads[idx] = thread;
  else threads.unshift(thread);
  threads.sort((a, b) => b.updatedAt - a.updatedAt);
  saveThreads(threads);
}

export function deleteThread(id: string) {
  saveThreads(loadThreads().filter((t) => t.id !== id));
}

export function getThread(id: string): ChatThread | undefined {
  return loadThreads().find((t) => t.id === id);
}
