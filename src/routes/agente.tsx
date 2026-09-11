import { createFileRoute, Outlet, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, Trash2, Bot } from "lucide-react";
import {
  loadThreads,
  createThread,
  saveThreads,
  deleteThread,
  type ChatThread,
} from "@/lib/threads";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agente")({
  head: () => ({
    meta: [
      { title: "Agente Personal — ErgoPomodoro" },
      {
        name: "description",
        content:
          "Converse com o Agente Personal: conte seus objetivos físicos e receba metas e rotinas de movimento para o home office.",
      },
      { property: "og:title", content: "Agente Personal — ErgoPomodoro" },
      {
        property: "og:description",
        content: "Metas e rotinas de movimento personalizadas para quem trabalha em casa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgenteLayout,
});

function AgenteLayout() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const [threads, setThreads] = useState<ChatThread[]>([]);

  const refresh = useCallback(() => setThreads(loadThreads()), []);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  // Refresh list when a thread updates its messages (same-tab updates don't fire "storage")
  useEffect(() => {
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [refresh]);

  const newThread = () => {
    const thread = createThread();
    saveThreads([thread, ...loadThreads()]);
    refresh();
    navigate({ to: "/agente/$threadId", params: { threadId: thread.id } });
  };

  const removeThread = (id: string) => {
    deleteThread(id);
    refresh();
    if (params.threadId === id) {
      const remaining = loadThreads();
      if (remaining[0]) {
        navigate({ to: "/agente/$threadId", params: { threadId: remaining[0].id } });
      } else {
        navigate({ to: "/agente" });
      }
    }
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl gap-0 px-4 py-6">
      <aside className="mr-4 hidden w-64 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 sm:flex">
        <Button onClick={newThread} className="gap-2 rounded-xl">
          <MessageSquarePlus className="size-4" />
          Nova conversa
        </Button>
        <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="px-2 pt-4 text-xs text-muted-foreground">
              Nenhuma conversa ainda. Comece uma nova!
            </p>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl px-2 py-1.5 transition-colors",
                params.threadId === t.id ? "bg-secondary" : "hover:bg-secondary/60",
              )}
            >
              <Link
                to="/agente/$threadId"
                params={{ threadId: t.id }}
                className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-sm"
              >
                <Bot className="size-4 shrink-0 text-primary" />
                <span className="truncate">{t.title}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Excluir conversa ${t.title}`}
                className="opacity-0 group-hover:opacity-100"
                onClick={() => removeThread(t.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border p-2 sm:hidden">
          <Button size="sm" onClick={newThread} className="shrink-0 gap-1.5 rounded-full">
            <MessageSquarePlus className="size-4" />
            Nova
          </Button>
          {threads.map((t) => (
            <Link
              key={t.id}
              to="/agente/$threadId"
              params={{ threadId: t.id }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                params.threadId === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {t.title}
            </Link>
          ))}
        </div>
        <Outlet />
      </div>
    </main>
  );
}
