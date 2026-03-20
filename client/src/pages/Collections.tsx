import { useRef, useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Info, Lock, Award, X, Download } from "lucide-react";

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
          borderRadius: "5.84px",
          overflow: "hidden",
          border: "0.487px solid rgba(255,255,255,0.05)",
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
          background: "rgba(255,255,255,0.1)",
        }}
      />
      <span
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "4px",
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        SAINTS
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}

function CertificateInfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
      data-testid="certificate-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#141618",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "100%",
          padding: "36px 32px 32px",
          position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        data-testid="certificate-modal"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
          }}
          data-testid="button-close-certificate-modal"
        >
          <X size={15} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e 0%, #e8c97a 50%, #b8912a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Award size={20} color="#0b0b0b" />
          </div>
          <h2
            style={{
              fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
              fontSize: "22px",
              fontWeight: 500,
              color: "white",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Certificate of Completion
          </h2>
        </div>

        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "15px",
            lineHeight: "1.65",
            color: "rgba(255,255,255,0.65)",
            marginBottom: "16px",
          }}
        >
          Upon completing all 30 days of the Lumen Fidei formation program, you will receive a personalized Certificate of Completion to mark your journey of healing, prayer, and encounter with God.
        </p>

        <p
          style={{
            fontFamily: "'Afacad', sans-serif",
            fontSize: "15px",
            lineHeight: "1.65",
            color: "rgba(255,255,255,0.65)",
            marginBottom: "24px",
          }}
        >
          The certificate is a tangible testimony of your commitment — a reminder that you chose to open the doors of your heart to Christ and walk the full 30-day journey.
        </p>

        <div
          style={{
            background: "rgba(200,169,110,0.08)",
            border: "0.5px solid rgba(200,169,110,0.2)",
            borderRadius: "8px",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontFamily: "'Afacad', sans-serif",
              fontSize: "13px",
              lineHeight: "1.55",
              color: "rgba(200,169,110,0.85)",
              margin: 0,
            }}
          >
            Complete all 30 daily lessons to unlock your downloadable PDF certificate.
          </p>
        </div>
      </div>
    </div>
  );
}

function CertificateDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginTop: "48px",
        marginBottom: "24px",
      }}
    >
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
      <span
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "4px",
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        CERTIFICATE
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
    </div>
  );
}

function CertificateModule() {
  const { toast } = useToast();
  const { data: completions } = useQuery<{ dayNumber: number }[]>({
    queryKey: ["/api/prayer-completions"],
  });

  const completedDayNumbers = new Set(completions?.map((c) => c.dayNumber) ?? []);
  const isUnlocked = Array.from({ length: 30 }, (_, i) => i + 1).every((d) =>
    completedDayNumbers.has(d)
  );

  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = () => {
    if (!isUnlocked) {
      toast({
        title: "Certificate locked",
        description: "Complete all 30 days to unlock your certificate.",
      });
      return;
    }
    toast({
      title: "Certificate coming soon",
      description: "Your PDF certificate will be available here shortly.",
    });
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      {showModal && <CertificateInfoModal onClose={() => setShowModal(false)} />}

      <div
        className="col-span-3 sm:col-span-5"
        style={{ paddingTop: "56px", position: "relative" }}
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCardClick}
          data-testid="certificate-module"
          style={{
            position: "relative",
            background: "#0f1011",
            border: "0.487px solid rgba(255,255,255,0.08)",
            borderRadius: "5.84px",
            height: "140px",
            overflow: "visible",
            cursor: isUnlocked ? "pointer" : "default",
            boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "5.84px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                filter: isHovered ? "grayscale(0)" : "grayscale(1)",
                transition: "filter 0.5s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, #1a1208 0%, #1c1710 35%, #161310 55%, #0f1011 70%)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "58%",
                  overflow: "visible",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "180px",
                    background:
                      "linear-gradient(to right, #0f1011 0%, rgba(15,16,17,0.6) 50%, transparent 100%)",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "calc(100% + 56px)",
                    transform: isHovered ? "translateY(-10px)" : "translateY(0px)",
                    transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "90%",
                      height: "90%",
                      background:
                        "linear-gradient(135deg, #2a2010 0%, #3d2e12 20%, #c8a450 40%, #e8d080 50%, #c8a450 60%, #3d2e12 80%, #1a1208 100%)",
                      borderRadius: "4px 4px 0 0",
                      position: "relative",
                      boxShadow: "0 -8px 32px rgba(200,164,80,0.15), inset 0 1px 0 rgba(255,220,100,0.3)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: "6px",
                        border: "0.5px solid rgba(200,164,80,0.4)",
                        borderRadius: "2px",
                        pointerEvents: "none",
                      }}
                    />
                    <Award
                      size={22}
                      color="rgba(232,208,128,0.9)"
                      style={{ marginBottom: "6px" }}
                    />
                    <div
                      style={{
                        fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "rgba(232,208,128,0.85)",
                        textAlign: "center",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        lineHeight: 1.4,
                      }}
                    >
                      Lumen Fidei
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 28px",
                zIndex: 3,
                pointerEvents: "none",
                maxWidth: "52%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                {isUnlocked ? (
                  <Download size={14} color="rgba(200,169,110,0.8)" />
                ) : (
                  <Lock size={13} color="rgba(255,255,255,0.3)" />
                )}
                <span
                  style={{
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: isUnlocked
                      ? "rgba(200,169,110,0.8)"
                      : "rgba(255,255,255,0.28)",
                  }}
                >
                  {isUnlocked ? "Download" : "Locked"}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(16px, 2.2vw, 22px)",
                  fontWeight: 500,
                  color: "white",
                  margin: "0 0 6px",
                  lineHeight: 1.2,
                }}
              >
                Certificate of Completion
              </h3>

              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {isUnlocked
                  ? "Your 30-day journey is complete. Download your certificate."
                  : "Complete all 30 days to unlock your certificate."}
              </p>
            </div>
          </div>

          <button
            onClick={handleInfoClick}
            data-testid="button-certificate-info"
            style={{
              position: "absolute",
              top: "12px",
              right: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.35)",
              zIndex: 10,
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
            }}
          >
            <Info size={13} />
          </button>

          {isHovered && !isUnlocked && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "5.84px",
                pointerEvents: "none",
                zIndex: 4,
                background:
                  "linear-gradient(135deg, rgba(200,169,110,0.03) 0%, transparent 60%)",
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function Collections() {
  return (
    <DashboardLayout>
      <div
        data-testid="collections-page"
        className="px-5 sm:px-[107px] pt-8 pb-20 min-h-[calc(100vh-72px)]"
      >
        <h1
          style={{
            fontFamily: "'Ivy Ora Display', 'Cormorant Garamond', Georgia, serif",
            fontWeight: 500,
            fontSize: "42px",
            color: "white",
            textAlign: "center",
            lineHeight: "1.1",
            marginBottom: "48px",
          }}
        >
          Collection
        </h1>

        <SaintsDivider />

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {SAINTS.map((saint) => (
            <HoloCard key={saint.id} saint={saint} />
          ))}
          <CertificateModule />
        </div>
      </div>
    </DashboardLayout>
  );
}
