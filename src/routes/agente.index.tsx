import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadThreads, createThread, saveThreads } from "@/lib/threads";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/agente/")({
  component: AgenteIndex,
});

function AgenteIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    let threads = loadThreads();
    if (threads.length === 0) {
      const thread = createThread("Minhas metas");
      threads = [thread];
      saveThreads(threads);
    }
    navigate({
      to: "/agente/$threadId",
      params: { threadId: threads[0]!.id },
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Shimmer className="text-sm">Abrindo sua conversa...</Shimmer>
    </div>
  );
}
