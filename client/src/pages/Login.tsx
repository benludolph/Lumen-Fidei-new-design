import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import landscapeImg from "@assets/Inner_Image_(1)_1774128191496.webp";
import logoImg from "@assets/NewLogo_(1)_1774128194728.webp";

const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, user } = useAuth();
  const [_, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "mentor") setLocation("/mentor");
      else setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      await login({ username: data.username, password: data.password });
    } catch (err: any) {
      setError(err.message || "Failed to login");
    }
  };

  return (
    <>
      <style>{`
        .lf-login-outer {
          background: #000;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 96px;
          box-sizing: border-box;
        }
        .lf-login-inner {
          position: relative;
          max-width: 1320px;
          width: 100%;
          min-height: 685px;
          border-left: 1px solid rgba(255,255,255,0.2);
          border-right: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 145px 32px 161px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .lf-login-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          padding: 0 372px;
          width: 100%;
          box-sizing: border-box;
        }
        .lf-login-card {
          background: #0f1011;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          max-width: 466px;
          min-width: 400px;
          width: 466px;
          padding: 17px 33px 33px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .lf-login-outer {
            padding: 0;
            align-items: flex-start;
          }
          .lf-login-inner {
            border-left: 1px solid rgba(255,255,255,0.1);
            border-right: 1px solid rgba(255,255,255,0.1);
            padding: 145px 0 161px;
            min-height: 100vh;
          }
          .lf-login-content {
            padding: 0 20px;
          }
          .lf-login-card {
            max-width: none;
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="lf-login-outer">
        <div className="lf-login-inner">

          {/* Landscape painting — full cover */}
          <img
            src={landscapeImg}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              pointerEvents: "none",
            }}
          />

          {/* Radial gradient vignette */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 80% 55% at 50% 5%, rgba(0,0,0,0) 33%, rgba(0,0,0,0.97) 80%)",
              pointerEvents: "none",
            }}
          />

          {/* Content column */}
          <div className="lf-login-content">

            {/* Logo */}
            <img
              src={logoImg}
              alt="Lumen Fidei"
              data-testid="img-lumen-logo"
              style={{ width: "220px", height: "auto", display: "block" }}
            />

            {/* Login card */}
            <div className="lf-login-card">

              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "16px",
                  fontWeight: 400,
                  letterSpacing: "3.2px",
                  textTransform: "uppercase",
                  color: "white",
                  textAlign: "center",
                  margin: 0,
                  lineHeight: "31.2px",
                }}
              >
                Log in
              </p>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                {/* Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "5px" }}>
                  <label
                    htmlFor="email"
                    style={{
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "14px",
                      color: "white",
                      lineHeight: "14px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...form.register("username")}
                    data-testid="input-email"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.03)",
                      borderRadius: "6px",
                      height: "36px",
                      width: "100%",
                      color: "white",
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "14px",
                      padding: "0 12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)"; }}
                  />
                  {form.formState.errors.username && (
                    <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "12px", color: "#ef4444", margin: 0 }}>
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "5px" }}>
                  <label
                    htmlFor="password"
                    style={{
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "14px",
                      color: "white",
                      lineHeight: "14px",
                    }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    data-testid="input-password"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.03)",
                      borderRadius: "6px",
                      height: "36px",
                      width: "100%",
                      color: "white",
                      fontFamily: "'Afacad', sans-serif",
                      fontSize: "14px",
                      padding: "0 12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)"; }}
                  />
                  {form.formState.errors.password && (
                    <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "12px", color: "#ef4444", margin: 0 }}>
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {error && (
                  <p style={{ fontFamily: "'Afacad', sans-serif", fontSize: "13px", color: "#ef4444", margin: 0, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: "6px" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  data-testid="button-login"
                  style={{
                    marginTop: "4px",
                    width: "100%",
                    height: "36px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "white",
                    fontFamily: "'Afacad', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    cursor: form.formState.isSubmitting ? "not-allowed" : "pointer",
                    opacity: form.formState.isSubmitting ? 0.5 : 1,
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!form.formState.isSubmitting) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p
                style={{
                  fontFamily: "'Afacad', sans-serif",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.3)",
                  textAlign: "center",
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                }}
              >
                Having trouble? Contact bludolph@archchicago.org
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
