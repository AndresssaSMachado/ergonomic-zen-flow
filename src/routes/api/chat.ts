import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Serviço de IA não configurado." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const { messages } = (await request.json()) as { messages: UIMessage[] };

        const gateway = createOpenAICompatible({
          name: "lovable-ai-gateway",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
        });

        const result = streamText({
          model: gateway("google/gemini-3.8-flash"),
          system: [
            "Você é o Agente Personal do ErgoPomodoro, um coach de saúde e movimento para quem trabalha em home office.",
            "Responda sempre em português do Brasil, com tom acolhedor, direto e motivador.",
            "Quando o usuário contar seus objetivos físicos, sugira metas semanais realistas e rotinas curtas de movimento que cabem nas pausas do Pomodoro (exercícios de 1 a 5 minutos, sem equipamento).",
            "Estruture as respostas com listas curtas e metas claras. Pergunte sobre dores ou limitações antes de sugerir exercícios intensos.",
            "Nunca dê diagnósticos médicos; recomende procurar um profissional de saúde quando houver dor persistente.",
          ].join("\n"),
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
        });
      },
    },
  },
});
