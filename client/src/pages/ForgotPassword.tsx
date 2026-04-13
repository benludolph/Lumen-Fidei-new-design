import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import landscapeImg from "@assets/OilPaintingBG_1774227836014.webp";
import logoImg from "@assets/NewLogo_(1)_1774128194728.webp";

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setNetworkError(null);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: data.email });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to")) {
        setNetworkError("Could not reach the server. Please check your connection and try again.");
      } else {
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .lf-forgot-outer {
          background: var(--surface-ground);
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 0 96px;
          box-sizing: border-box;
        }
        .lf-forgot-inner {
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
        .lf-forgot-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          width: 100%;
        }
        .lf-forgot-logo { width: 220px; height: auto; display: block; }
        .lf-forgot-card {
          background: var(--surface-base);
          border: 1px solid var(--white-5);
          border-radius: 8px;
          max-width: 466px;
          width: 100%;
          padding: 17px 33px 33px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .lf-forgot-outer { padding: 0; }
          .lf-forgot-inner { border-left-color: var(--white-10); border-right-color: var(--white-10); padding: 145px 20px 161px; }
          .lf-forgot-logo { width: 180px; }
        }
      `}</style>

      <div className="lf-forgot-outer">
        <div className="lf-forgot-inner">
          <img
            src={landscapeImg}
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", pointerEvents: "none", userSelect: "none" }}
          />

          <div className="lf-forgot-content">
            <img src={logoImg} alt="Lumen Fidei" className="lf-forgot-logo" />

            <div className="lf-forgot-card">
              {submitted ? (
                <div className="flex flex-col gap-4 text-center">
                  <p className="type-caption-lg" style={{ color: "white", margin: 0 }}>
                    Check your inbox
                  </p>
                  <p className="type-body-md" style={{ color: "var(--white-60)", margin: 0, lineHeight: 1.6 }}>
                    If an account exists for that email, we've sent a password reset link. It will expire in 1 hour.
                  </p>
                  <Link href="/login">
                    <span
                      className="type-body-md"
                      style={{ color: "var(--white-40)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
                    >
                      Back to sign in
                    </span>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="type-caption-lg text-center" style={{ color: "white", margin: 0 }}>
                    Forgot your password?
                  </p>
                  <p className="type-body-md" style={{ color: "var(--white-50)", margin: "0 0 4px", lineHeight: 1.5 }}>
                    Enter your email and we'll send you a reset link.
                  </p>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 pt-[5px]">
                      <label htmlFor="email" className="type-body-md" style={{ color: "white" }}>
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...form.register("email")}
                        data-testid="input-forgot-email"
                        className="type-body-md"
                        style={{ background: "var(--white-5)", border: "1px solid var(--white-3)", borderRadius: "6px", height: "36px", width: "100%", color: "white", padding: "0 12px", outline: "none", boxSizing: "border-box" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white-15)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--white-3)"; }}
                      />
                      {form.formState.errors.email && (
                        <p className="type-body-sm" style={{ color: "#ef4444", margin: 0 }}>
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      data-testid="button-send-reset"
                      className="type-body-md font-medium"
                      style={{ marginTop: "4px", width: "100%", height: "36px", background: "var(--white-7)", border: "1px solid var(--white-10)", borderRadius: "6px", color: "white", letterSpacing: "2px", textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1, transition: "background 0.2s, border-color 0.2s" }}
                      onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = "var(--white-12)"; e.currentTarget.style.borderColor = "var(--white-18)"; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--white-7)"; e.currentTarget.style.borderColor = "var(--white-10)"; }}
                    >
                      {isLoading ? "Sending…" : "Send reset link"}
                    </button>
                  </form>

                  {networkError && (
                    <p className="type-body-sm text-center" style={{ color: "#ef4444", margin: "4px 0 0" }}>
                      {networkError}
                    </p>
                  )}

                  <p className="type-body-sm text-center" style={{ color: "var(--white-30)", margin: "4px 0 0" }}>
                    Remember your password?{" "}
                    <Link href="/login">
                      <span style={{ color: "var(--white-50)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                        Sign in
                      </span>
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
