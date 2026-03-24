import { useRef, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";

import augustineImg from "@assets/Augustine_1773958855879.webp";
import benedictImg from "@assets/Benedict_1773958855880.webp";
import catherineImg from "@assets/Catherine_of_Siena_1773958855880.webp";
import francisImg from "@assets/Francis_1773958855880.webp";
import francisBorgiaImg from "@assets/Francis_Borgia_1773958855880.webp";
import gemmaImg from "@assets/Gemma_Galgani_1773958855880.webp";
import johnCrossImg from "@assets/John_of_the_Cross_1773958855880.png";
import johnVianImg from "@assets/John_Vianney_1773958855880.webp";
import josephImg from "@assets/Joseph_1773958855880.webp";
import maxImg from "@assets/Maximilian_Kolbe_1773958855880.webp";
import padreImg from "@assets/Padre_Pio_1773958855880.webp";
import jpiiImg from "@assets/Pope_JOhn_Paul_II_1773958855880.webp";
import teresaCalcImg from "@assets/Teresa_of_Calcutta_1773958855880.webp";
import teresaAvilaImg from "@assets/Teresa_1773958855880.webp";
import thereseImg from "@assets/Therese_of_Liseux_1773958855881.webp";

interface Saint {
  id: string;
  name: string;
  image: string;
}

const SAINTS: Saint[] = [
  { id: "augustine", name: "St. Augustine of Hippo", image: augustineImg },
  { id: "benedict", name: "St. Benedict", image: benedictImg },
  { id: "catherine", name: "St. Catherine of Siena", image: catherineImg },
  { id: "francis", name: "St. Francis of Assisi", image: francisImg },
  { id: "francis-borgia", name: "St. Francis Borgia", image: francisBorgiaImg },
  { id: "gemma", name: "St. Gemma Galgani", image: gemmaImg },
  { id: "john-cross", name: "St. John of the Cross", image: johnCrossImg },
  { id: "john-vian", name: "St. John Vianney", image: johnVianImg },
  { id: "joseph", name: "St. Joseph", image: josephImg },
  { id: "maximilian", name: "St. Maximilian Kolbe", image: maxImg },
  { id: "padre-pio", name: "Padre Pio", image: padreImg },
  { id: "jpii", name: "Pope John Paul II", image: jpiiImg },
  { id: "teresa-calcutta", name: "St. Teresa of Calcutta", image: teresaCalcImg },
  { id: "teresa-avila", name: "St. Teresa of Ávila", image: teresaAvilaImg },
  { id: "therese", name: "St. Thérèse of Lisieux", image: thereseImg },
];

function HoloCard({ saint }: { saint: Saint }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const rainbowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isHovering = useRef(false);

  const applyEffect = useCallback((mx: number, my: number, rect: DOMRect) => {
    const px = (mx - rect.left) / rect.width;
    const py = (my - rect.top) / rect.height;
    const cx = px - 0.5;
    const cy = py - 0.5;

    const rotateX = cy * -14;
    const rotateY = cx * 14;

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`;
      cardRef.current.style.transition = "none";
    }

    if (overlayRef.current) {
      overlayRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.18) 0%, rgba(120,180,255,0.08) 30%, transparent 65%)`;
      overlayRef.current.style.opacity = "1";
    }

    if (sheenRef.current) {
      const angle = 120;
      const pos = (px * 100 + py * 100) / 2;
      sheenRef.current.style.background = `linear-gradient(${angle}deg, transparent ${pos - 25}%, rgba(255,255,255,0.12) ${pos}%, rgba(255,255,255,0.08) ${pos + 5}%, transparent ${pos + 30}%)`;
      sheenRef.current.style.opacity = "1";
    }

    if (rainbowRef.current) {
      rainbowRef.current.style.opacity = "0.15";
      const hueShift = px * 120;
      rainbowRef.current.style.background = `linear-gradient(${125 + cx * 30}deg, hsl(${200 + hueShift},100%,70%) 0%, hsl(${240 + hueShift},90%,65%) 25%, hsl(${280 + hueShift},85%,60%) 50%, hsl(${200 + hueShift},80%,70%) 75%, hsl(${220 + hueShift},90%,65%) 100%)`;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering.current) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX;
    const my = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => applyEffect(mx, my, rect));
  }, [applyEffect]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isHovering.current = true;
    if (rainbowRef.current) rainbowRef.current.style.opacity = "0.15";
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    applyEffect(e.clientX, e.clientY, rect);
  }, [applyEffect]);

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.4s ease";
      cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = "opacity 0.4s ease";
      overlayRef.current.style.opacity = "0";
    }
    if (sheenRef.current) {
      sheenRef.current.style.transition = "opacity 0.4s ease";
      sheenRef.current.style.opacity = "0";
    }
    if (rainbowRef.current) {
      rainbowRef.current.style.transition = "opacity 0.4s ease";
      rainbowRef.current.style.opacity = "0";
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{ perspective: "800px", cursor: "pointer" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`card-saint-${saint.id}`}
    >
      <div
        ref={cardRef}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: "6px",
          overflow: "hidden",
          border: "0.5px solid var(--white-5)",
          transformStyle: "preserve-3d",
          willChange: "transform",
          boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        <img
          src={saint.image}
          alt={saint.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
          draggable={false}
        />

        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            zIndex: 1,
          }}
        />

        <div
          ref={sheenRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            zIndex: 2,
          }}
        />

        <div
          ref={rainbowRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            mixBlendMode: "color-dodge",
            zIndex: 3,
            background:
              "linear-gradient(125deg, hsl(200,100%,70%) 0%, hsl(240,90%,65%) 25%, hsl(280,85%,60%) 50%, hsl(200,80%,70%) 75%, hsl(220,90%,65%) 100%)",
          }}
        />
      </div>
    </div>
  );
}

function SaintsDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "var(--white-10)",
        }}
      />
      <span className="type-caption-md" style={{ color: "var(--white-35)", whiteSpace: "nowrap" }}>
        SAINTS
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "var(--white-10)",
        }}
      />
    </div>
  );
}

export default function Collections() {
  return (
    <DashboardLayout>
      <PageContainer
        variant="full"
        className="pt-8 pb-20 min-h-[calc(100vh-72px)]"
      >
        <div data-testid="collections-page">
          <h1 className="type-display-xl text-center text-white" style={{ marginBottom: "48px" }}>
            Collection
          </h1>

          <SaintsDivider />

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {SAINTS.map((saint) => (
              <HoloCard key={saint.id} saint={saint} />
            ))}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
