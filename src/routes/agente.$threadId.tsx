import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { getThread, upsertThread } from "@/lib/threads";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/agente/$threadId")({
  component: ThreadChat,
});

function messageText(message: UIMessage | undefined): string {
  return (message?.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function ThreadChat() {
  const { threadId } = Route.useParams();

  const initialMessages = useMemo<UIMessage[]>(
    () => getThread(threadId)?.messages ?? [],
    [threadId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persiste mensagens no navegador quando a resposta termina
  useEffect(() => {
    if (status !== "ready") return;
    const thread = getThread(threadId);
    if (!thread) return;
    const firstUserMessage = messages.find((m) => m.role === "user");
    const title =
      thread.title !== "Nova conversa"
        ? thread.title
        : messageText(firstUserMessage ?? ({} as UIMessage)).slice(0, 40) || thread.title;
    upsertThread({ ...thread, title, messages, updatedAt: Date.now() });
  }, [messages, status, threadId]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="gap-6 p-4 sm:p-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img src={logo} alt="ErgoPomodoro" width={72} height={72} className="breathe" />
              }
              title="Olá! Sou seu Agente Personal"
              description="Conte seus objetivos físicos — como ter menos dor nas costas, mais energia ou alongar-se todos os dias — e eu monto metas e rotinas de movimento que cabem nas suas pausas."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent
                  className={cn(
                    message.role === "user" &&
                      "rounded-2xl bg-primary px-4 py-3 text-primary-foreground",
                  )}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer className="text-sm">Pensando...</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Não consegui responder agora. Tente enviar sua mensagem novamente em alguns
              instantes.
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3 sm:p-4">
        <PromptInput
          onSubmit={({ text }) => {
            if (!text.trim()) return;
            void sendMessage({ text });
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Ex.: quero fortalecer as costas e alongar mais durante o dia..."
            aria-label="Mensagem para o Agente Personal"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
