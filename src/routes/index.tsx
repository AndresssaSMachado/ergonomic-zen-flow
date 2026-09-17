import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, Leaf, RefreshCw } from "lucide-react";
import { exercises } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Mode = "focus" | "break";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ErgoPomodoro — Timer Pomodoro com pausas ativas" },
      {
        name: "description",
        content:
          "Timer Pomodoro de 25 minutos com pausas ativas guiadas por exercícios laborais ilustrados para quem trabalha em home office.",
      },
      { property: "og:title", content: "ErgoPomodoro — Timer Pomodoro com pausas ativas" },
      {
        property: "og:description",
        content:
          "Trabalhe focado por 25 minutos e descanse 5 minutos com exercícios laborais ilustrados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Index() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [pendingTransition, setPendingTransition] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const notifiedRef = useRef(false);

  const total = mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
  const progress = 1 - secondsLeft / total;
  const exercise = exercises[exerciseIndex % exercises.length]!;

  const beep = useCallback(() => {
    try {
      audioRef.current ??= new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // som indisponível; segue sem áudio
    }
  }, []);

  const advance = useCallback(() => {
    const nextMode: Mode = mode === "focus" ? "break" : "focus";
    const nextTotal = nextMode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
    if (mode === "focus") {
      setCycles((c) => c + 1);
      setExerciseIndex((i) => (i + 1) % exercises.length);
    }
    setMode(nextMode);
    setSecondsLeft(nextTotal);
    setPendingTransition(false);
    setRunning(true);
    deadlineRef.current = Date.now() + nextTotal * 1000;
    notifiedRef.current = false;
  }, [mode]);

  // O tempo é calculado a partir do relógio real, então continua correndo
  // mesmo com a aba em segundo plano ou minimizada. Quando uma etapa termina
  // em segundo plano, o timer pausa e espera você voltar para trocar de etapa.
  useEffect(() => {
    if (pendingTransition) {
      deadlineRef.current = null;
      return;
    }
    if (!running) {
      deadlineRef.current = null;
      return;
    }
    deadlineRef.current ??= Date.now() + secondsLeft * 1000;

    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline == null) return;
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
        return;
      }
      beep();
      if (document.visibilityState !== "visible") {
        // Aba em segundo plano: não troca automaticamente de etapa.
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          setRunning(false);
          setSecondsLeft(0);
          setPendingTransition(true);
        }
        return;
      }
      // Aba visível: troca automaticamente para a próxima etapa.
      const nextMode: Mode = mode === "focus" ? "break" : "focus";
      const nextTotal = nextMode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
      if (mode === "focus") {
        setCycles((c) => c + 1);
        setExerciseIndex((i) => (i + 1) % exercises.length);
      }
      deadlineRef.current = Date.now() + nextTotal * 1000;
      setMode(nextMode);
      setSecondsLeft(nextTotal);
    };

    const id = setInterval(tick, 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, beep, pendingTransition, advance]);

  const reset = () => {
    setRunning(false);
    setPendingTransition(false);
    notifiedRef.current = false;
    deadlineRef.current = null;
    setSecondsLeft(mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const skip = () => {
    const nextMode: Mode = mode === "focus" ? "break" : "focus";
    const nextTotal = nextMode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
    if (mode === "focus") setCycles((c) => c + 1);
    setMode(nextMode);
    setSecondsLeft(nextTotal);
    setPendingTransition(false);
    notifiedRef.current = false;
    deadlineRef.current = running ? Date.now() + nextTotal * 1000 : null;
  };

  const ring = useMemo(() => {
    const r = 130;
    const circumference = 2 * Math.PI * r;
    return { r, circumference, offset: circumference * (1 - progress) };
  }, [progress]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col items-center justify-center gap-10 px-4 py-10">
      <div className="fade-up flex flex-col items-center gap-3 text-center">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide",
            pendingTransition
              ? "bg-amber-500 text-white"
              : mode === "focus"
                ? "bg-primary text-primary-foreground"
                : "bg-break text-primary-foreground",
          )}
        >
          <Leaf className="size-4" />
          {pendingTransition
            ? mode === "focus"
              ? "Foco concluído"
              : "Pausa concluída"
            : mode === "focus"
              ? "Tempo de foco"
              : "Pausa ativa"}
        </span>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {pendingTransition
            ? mode === "focus"
              ? "Você completou o tempo de foco"
              : "Você completou a pausa ativa"
            : mode === "focus"
              ? "Concentre-se na sua tarefa"
              : "Levante, respire e alongue-se"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {pendingTransition
            ? mode === "focus"
              ? "O tempo de foco acabou enquanto a aba estava em segundo plano. Inicie a pausa quando estiver pronto."
              : "A pausa acabou enquanto a aba estava em segundo plano. Inicie o próximo foco quando estiver pronto."
            : mode === "focus"
              ? "25 minutos de foco profundo. Quando a pausa chegar, um exercício laboral te espera."
              : "5 minutos para aliviar a tensão do corpo. Siga o exercício abaixo no seu ritmo."}
        </p>
      </div>

      <div className={cn("flex w-full flex-col items-center gap-10", mode === "break" && "lg:flex-row lg:items-start lg:justify-center")}>
        <div className="fade-up relative flex items-center justify-center">
          <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
            <circle
              cx="150"
              cy="150"
              r={ring.r}
              fill="none"
              strokeWidth="10"
              className="stroke-border"
            />
            <circle
              cx="150"
              cy="150"
              r={ring.r}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ring.circumference}
              strokeDashoffset={ring.offset}
              className={cn(
                "timer-ring-transition",
                mode === "focus" ? "stroke-focus" : "stroke-break",
              )}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
              {formatTime(secondsLeft)}
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {mode === "focus" ? "de foco" : "de pausa"}
            </span>
          </div>
        </div>

        <div className="fade-up flex items-center gap-3">
          <Button
            size="lg"
            onClick={() => setRunning((r) => !r)}
            className="h-12 gap-2 rounded-full px-8 text-base"
          >
            {running ? <Pause className="size-5" /> : <Play className="size-5" />}
            {running ? "Pausar" : "Iniciar"}
          </Button>
          <Button variant="outline" size="icon" onClick={reset} aria-label="Reiniciar timer" className="size-12 rounded-full">
            <RotateCcw className="size-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={skip} aria-label="Pular etapa" className="size-12 rounded-full">
            <SkipForward className="size-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {cycles} {cycles === 1 ? "ciclo completo" : "ciclos completos"} hoje
        </p>

        {mode === "break" && (
          <section
            aria-label="Exercício da pausa"
            className="fade-up w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
          >
            <div className="relative">
              <img
                src={exercise.image}
                alt={exercise.alt}
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-bold tabular-nums text-foreground shadow">
                {formatTime(secondsLeft)} restantes
              </span>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div>
                <h2 className="text-xl font-semibold">{exercise.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{exercise.focus}</p>
              </div>
              <ol className="flex flex-col gap-2.5">
                {exercise.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
              <Button
                variant="secondary"
                className="mt-1 gap-2 self-start rounded-full"
                onClick={() => setExerciseIndex((i) => (i + 1) % exercises.length)}
              >
                <RefreshCw className="size-4" />
                Outro exercício
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
