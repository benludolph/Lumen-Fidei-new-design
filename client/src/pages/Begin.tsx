import landscapeImg from "@assets/OilPaintingBG_1774227836014.webp";
import logoImg from "@assets/NewLogo_(1)_1774128194728.webp";

export default function Begin() {
  return (
    <>
      <style>{`
        .lf-begin-outer {
          background: var(--surface-ground);
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 0 96px;
          box-sizing: border-box;
        }

        .lf-begin-inner {
          position: relative;
          width: 100%;
          min-height: 100vh;
          border-left: 1px solid var(--white-20);
          border-right: 1px solid var(--white-20);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 145px 32px 161px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .lf-begin-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          width: 100%;
        }

        .lf-begin-logo {
          width: 220px;
          height: auto;
          display: block;
        }

        .lf-begin-video-card {
          background: #0F1011;
          border: 1px solid var(--white-5);
          border-radius: 8px;
          max-width: 640px;
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .lf-begin-video-ratio {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          height: 0;
        }

        .lf-begin-video-ratio iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }

        @media (max-width: 768px) {
          .lf-begin-outer {
            padding: 0;
          }
          .lf-begin-inner {
            border-left-color: var(--white-10);
            border-right-color: var(--white-10);
            padding: 145px 20px 161px;
          }
          .lf-begin-logo {
            width: 180px;
          }
        }
      `}</style>

      <div className="lf-begin-outer">
        <div className="lf-begin-inner">

          <img
            src={landscapeImg}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          <div className="lf-begin-content">

            <img
              src={logoImg}
              alt="Lumen Fidei"
              className="lf-begin-logo"
              data-testid="img-lumen-logo-begin"
            />

            <div className="lf-begin-video-card">
              <div className="lf-begin-video-ratio">
                <iframe
                  src="https://player.vimeo.com/video/1176422917?badge=0&autopause=0&player_id=0&app_id=58479"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  title="Lumen Fidei Introduction"
                  data-testid="iframe-intro-video"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
