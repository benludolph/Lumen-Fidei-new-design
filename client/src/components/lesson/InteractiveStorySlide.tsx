import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense, Component, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const LazyPlasmaOrb = lazy(() => import("./PlasmaOrb"));

type OrbState = "pure" | "crack" | "shell" | "scribbles";

class OrbErrorBoundary extends Component<
  { onError: () => void; fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface StoryStage {
  text: string;
  buttonLabel: string;
  orbState: OrbState;
  mechanic?: "tryHarder";
}

interface InteractiveStoryData {
  stages: StoryStage[];
  tryHarderTaps?: number;
  tryHarderMessage?: string;
}

const DEFAULT_STAGES: StoryStage[] = [
  {
    orbState: "pure",
    text: "Hi [NAME]!\nI'm your soul as a child!\nI'm excited for life! I'm hopeful for the future!\nI wonder what life has in store for me!",
    buttonLabel: "Step into the world",
  },
  {
    orbState: "crack",
    text: "Something happened today.\nSomeone I loved said something mean.\nIt felt like a cold wind blew through me.",
    buttonLabel: "Keep going",
  },
  {
    orbState: "shell",
    text: "To make sure that doesn't happen again,\nI built a little wall.",
    buttonLabel: "Try to be strong",
  },
  {
    orbState: "scribbles",
    text: "Now I'm older.\nI've been hurt, so I hurt people back.",
    buttonLabel: "Keep going",
  },
  {
    orbState: "scribbles",
    text: "",
    buttonLabel: "Try Harder",
    mechanic: "tryHarder",
  },
];

const DEFAULT_TRY_HARDER_TAPS = 4;
const DEFAULT_TRY_HARDER_MESSAGE = "I tried to fix myself…\nbut I couldn't reach the light anymore.";

function GlowOrb({ state, shake }: { state: OrbState; shake: boolean }) {
  const orbSize = 180;
  const halfSize = orbSize / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: orbSize, height: orbSize }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: orbSize + 30,
          height: orbSize + 30,
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      <motion.div
        animate={shake ? {
          x: [0, -6, 6, -4, 4, -2, 2, 0],
          transition: { duration: 0.5 },
        } : {
          scale: [1, 1.04, 1],
          transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="relative rounded-full overflow-hidden"
        style={{ width: orbSize, height: orbSize }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: state === "scribbles"
              ? "radial-gradient(circle at 40% 40%, rgba(212,175,55,0.5) 0%, rgba(180,140,20,0.3) 40%, rgba(80,60,10,0.6) 100%)"
              : state === "shell"
              ? "radial-gradient(circle at 40% 40%, rgba(212,175,55,0.85) 0%, rgba(200,160,30,0.6) 50%, rgba(160,140,80,0.4) 100%)"
              : state === "crack"
              ? "radial-gradient(circle at 40% 40%, rgba(255,223,100,0.95) 0%, rgba(212,175,55,0.8) 50%, rgba(180,140,20,0.5) 100%)"
              : "radial-gradient(circle at 40% 40%, rgba(255,235,140,1) 0%, rgba(212,175,55,0.9) 50%, rgba(200,160,30,0.6) 100%)",
            boxShadow: state === "pure"
              ? "0 0 40px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.3), inset 0 0 30px rgba(255,235,140,0.4)"
              : state === "crack"
              ? "0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.2), inset 0 0 20px rgba(255,235,140,0.3)"
              : state === "shell"
              ? "0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.15)"
              : "0 0 15px rgba(212,175,55,0.3), 0 0 30px rgba(212,175,55,0.1)",
          }}
        />

        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            opacity: state === "crack" ? [0.7, 1, 0.7] : [0.85, 1, 0.85],
          }}
          transition={{
            duration: state === "crack" ? 1.5 : 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }}
        />

        <AnimatePresence>
          {(state === "crack" || state === "scribbles") && (
            <motion.svg
              key="crack"
              className="absolute inset-0"
              viewBox={`0 0 ${orbSize} ${orbSize}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <path
                d={`M${halfSize - 5},${halfSize - 40} L${halfSize + 2},${halfSize - 15} L${halfSize - 8},${halfSize + 5} L${halfSize + 3},${halfSize + 30} L${halfSize - 2},${halfSize + 45}`}
                stroke="rgba(20,15,5,0.6)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${halfSize + 2},${halfSize - 15} L${halfSize + 18},${halfSize - 5}`}
                stroke="rgba(20,15,5,0.4)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(state === "shell" || state === "scribbles") && (
            <motion.div
              key="shell"
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              style={{
                border: "3px solid rgba(140,130,110,0.5)",
                boxShadow: "inset 0 0 15px rgba(100,90,70,0.3), inset 0 0 5px rgba(80,70,50,0.2)",
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state === "scribbles" && (
            <motion.svg
              key="scribbles"
              className="absolute inset-0"
              viewBox={`0 0 ${orbSize} ${orbSize}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <path
                d={`M${halfSize - 35},${halfSize - 25} Q${halfSize - 20},${halfSize - 35} ${halfSize - 5},${halfSize - 20} T${halfSize + 25},${halfSize - 30}`}
                stroke="rgba(30,25,15,0.45)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${halfSize - 30},${halfSize + 10} Q${halfSize - 10},${halfSize + 25} ${halfSize + 10},${halfSize + 5} T${halfSize + 35},${halfSize + 20}`}
                stroke="rgba(30,25,15,0.4)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${halfSize + 15},${halfSize - 15} Q${halfSize + 25},${halfSize} ${halfSize + 10},${halfSize + 15}`}
                stroke="rgba(30,25,15,0.35)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${halfSize - 25},${halfSize - 5} L${halfSize - 15},${halfSize + 8} L${halfSize - 22},${halfSize + 18}`}
                stroke="rgba(30,25,15,0.3)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function StoryText({ text, stageKey }: { text: string; stageKey: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
  }, [stageKey]);

  useEffect(() => {
    if (visibleCount >= lines.length) return;
    const delay = visibleCount === 0 ? 200 : 600;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount, lines.length]);

  return (
    <div className="text-center space-y-2">
      {lines.map((line, i) => (
        <motion.p
          key={`${stageKey}-line-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={i < visibleCount ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-['Afacad',sans-serif] text-neutral-700 dark:text-neutral-300 text-2xl leading-[36px] font-medium"
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}

export function InteractiveStorySlide({
  content,
  onInteracted,
}: {
  content: string;
  onInteracted?: () => void;
}) {
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState(0);
  const [tryHarderCount, setTryHarderCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [storyComplete, setStoryComplete] = useState(false);
  const [plasmaFailed, setPlasmaFailed] = useState(false);

  const handlePlasmaError = useCallback(() => setPlasmaFailed(true), []);

  const progressAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgLoopRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    progressAudioRef.current = new Audio("/sounds/piano_progress.mp3");
    progressAudioRef.current.volume = 0.6;

    const bgLoop = new Audio("/sounds/bg_piano_loop.wav");
    bgLoop.loop = true;
    bgLoop.volume = 0.003;
    bgLoopRef.current = bgLoop;
    bgLoop.play().catch(() => {});

    return () => {
      bgLoop.pause();
      bgLoop.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (storyComplete && bgLoopRef.current) {
      bgLoopRef.current.pause();
      bgLoopRef.current.currentTime = 0;
    }
  }, [storyComplete]);

  const playProgressSound = useCallback(() => {
    const audio = progressAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const data = useMemo<InteractiveStoryData>(() => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.stages && Array.isArray(parsed.stages)) return parsed;
    } catch {}
    return {
      stages: DEFAULT_STAGES,
      tryHarderTaps: DEFAULT_TRY_HARDER_TAPS,
      tryHarderMessage: DEFAULT_TRY_HARDER_MESSAGE,
    };
  }, [content]);

  const userName = user?.name?.split(" ")[0] || user?.username || "";
  const maxTaps = data.tryHarderTaps ?? DEFAULT_TRY_HARDER_TAPS;
  const finalMessage = data.tryHarderMessage ?? DEFAULT_TRY_HARDER_MESSAGE;

  const stage = data.stages[currentStage];

  const displayText = useMemo(() => {
    if (!stage) return "";
    return stage.text.replace(/\[NAME\]/g, userName);
  }, [stage, userName]);

  const handleButton = useCallback(() => {
    if (!stage) return;

    if (stage.mechanic === "tryHarder") {
      const nextCount = tryHarderCount + 1;
      setTryHarderCount(nextCount);
      setShaking(true);
      setTimeout(() => setShaking(false), 550);

      if (nextCount >= maxTaps) {
        setShowFinalMessage(true);
      }
      return;
    }

    if (currentStage < data.stages.length - 1) {
      playProgressSound();
      setTimeout(() => {
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setCurrentStage(currentStage + 1);
          setTryHarderCount(0);
          setShowFinalMessage(false);
        }, 550);
      }, 600);
    }
  }, [stage, currentStage, data.stages.length, tryHarderCount, maxTaps, playProgressSound]);

  const handleContinueAfterFinal = useCallback(() => {
    if (currentStage < data.stages.length - 1) {
      playProgressSound();
      setTimeout(() => {
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setCurrentStage(currentStage + 1);
          setTryHarderCount(0);
          setShowFinalMessage(false);
        }, 550);
      }, 600);
    } else {
      playProgressSound();
      setStoryComplete(true);
      onInteracted?.();
    }
  }, [currentStage, data.stages.length, onInteracted, playProgressSound]);

  if (!stage) return null;

  const isTryHarder = stage.mechanic === "tryHarder";
  const isLastStage = currentStage === data.stages.length - 1;

  const handleNonMechanicLast = useCallback(() => {
    if (isLastStage && !isTryHarder) {
      playProgressSound();
      setStoryComplete(true);
      onInteracted?.();
    }
  }, [isLastStage, isTryHarder, onInteracted, playProgressSound]);

  const textKey = `${currentStage}-${showFinalMessage ? "final" : "normal"}`;
  const currentText = showFinalMessage
    ? finalMessage.replace(/\[NAME\]/g, userName)
    : displayText;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full select-none bg-white dark:bg-neutral-950"
      data-testid="interactive-story-slide"
    >
      <div className="flex flex-col items-center max-w-sm mx-auto px-4 gap-8">
        {plasmaFailed ? (
          <GlowOrb state={stage.orbState} shake={shaking} />
        ) : (
          <OrbErrorBoundary onError={handlePlasmaError} fallback={<GlowOrb state={stage.orbState} shake={shaking} />}>
            <Suspense fallback={<GlowOrb state={stage.orbState} shake={shaking} />}>
              <LazyPlasmaOrb orbState={stage.orbState} shake={shaking} onError={handlePlasmaError} />
            </Suspense>
          </OrbErrorBoundary>
        )}

        <StoryText text={currentText} stageKey={textKey} />

        {!storyComplete && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`btn-${currentStage}-${showFinalMessage ? "final" : "normal"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {showFinalMessage ? (
                <Button
                  onClick={handleContinueAfterFinal}
                  className="rounded-full px-8 py-3 text-[15px] font-medium bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/30 transition-colors"
                  variant="ghost"
                  data-testid="button-story-continue-final"
                >
                  Continue
                </Button>
              ) : isLastStage && !isTryHarder ? (
                <Button
                  onClick={handleNonMechanicLast}
                  className="rounded-full px-8 py-3 text-[15px] font-medium bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/30 transition-colors"
                  variant="ghost"
                  data-testid="button-story-finish"
                >
                  {stage.buttonLabel}
                </Button>
              ) : (
                <Button
                  onClick={handleButton}
                  className="rounded-full px-8 py-3 text-[15px] font-medium bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/30 transition-colors"
                  variant="ghost"
                  data-testid="button-story-advance"
                >
                  {stage.buttonLabel}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
