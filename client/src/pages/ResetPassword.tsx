import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import landscapeImg from "@assets/OilPaintingBG_1774227836014.webp";
import logoImg from "@assets/NewLogo_(1)_1774128194728.webp";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <ResetLayout>
        <InvalidToken message="No reset token found." />
      </ResetLayout>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setTokenError(null);
    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      toast({ title: "Password reset!", description: "You can now sign in with your new password." });
      navigate("/login");
    } catch (err: unknown) {
      let displayMessage = "Something went wrong. Please request a new reset link.";
      if (err instanceof Error) {
        const raw = err.message;
        try {
          const colonIdx = raw.indexOf(":");
          const jsonStr = colonIdx !== -1 ? raw.slice(colonIdx + 1).trim() : raw;
          const parsed = JSON.parse(jsonStr) as { message?: string; code?: string };
          if (parsed.message) displayMessage = parsed.message;
        } catch {
          if (raw && !raw.startsWith("{") && raw.length < 200) {
            displayMessage = raw;
          }
        }
      }
      setTokenError(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <ResetLayout>
        <InvalidToken message={tokenError} />
      </ResetLayout>
    );
  }

  return (
    <ResetLayout>
      <>
        <p className="type-caption-lg text-center" style={{ color: "white", margin: 0 }}>
          Set a new password
        </p>
        <p className="type-body-md" style={{ color: "var(--white-50)", margin: "0 0 4px", lineHeight: 1.5 }}>
          Your new password must be at least 8 characters.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 pt-[5px]">
            <label htmlFor="newPassword" className="type-body-md" style={{ color: "white" }}>
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              {...form.register("newPassword")}
              data-testid="input-new-password"
              className="type-body-md"
              style={{ background: "var(--white-5)", border: "1px solid var(--white-3)", borderRadius: "6px", height: "36px", width: "100%", color: "white", padding: "0 12px", outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white-15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--white-3)"; }}
            />
            {form.formState.errors.newPassword && (
              <p className="type-body-sm" style={{ color: "#ef4444", margin: 0 }}>
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="type-body-md" style={{ color: "white" }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              data-testid="input-confirm-password"
              className="type-body-md"
              style={{ background: "var(--white-5)", border: "1px solid var(--white-3)", borderRadius: "6px", height: "36px", width: "100%", color: "white", padding: "0 12px", outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white-15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--white-3)"; }}
            />
            {form.formState.errors.confirmPassword && (
              <p className="type-body-sm" style={{ color: "#ef4444", margin: 0 }}>
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="button-reset-password"
            className="type-body-md font-medium"
            style={{ marginTop: "4px", width: "100%", height: "36px", background: "var(--white-7)", border: "1px solid var(--white-10)", borderRadius: "6px", color: "white", letterSpacing: "2px", textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1, transition: "background 0.2s, border-color 0.2s" }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = "var(--white-12)"; e.currentTarget.style.borderColor = "var(--white-18)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--white-7)"; e.currentTarget.style.borderColor = "var(--white-10)"; }}
          >
            {isLoading ? "Saving…" : "Save new password"}
          </button>
        </form>
      </>
    </ResetLayout>
  );
}

function InvalidToken({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="type-caption-lg" style={{ color: "white", margin: 0 }}>
        Link unavailable
      </p>
      <p className="type-body-md" style={{ color: "var(--white-60)", margin: 0, lineHeight: 1.6 }}>
        {message}
      </p>
      <Link href="/forgot-password">
        <span className="type-body-md" style={{ color: "var(--white-50)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>
          Request a new reset link
        </span>
      </Link>
    </div>
  );
}

function ResetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .lf-reset-outer { background: var(--surface-ground); min-height: 100vh; width: 100%; display: flex; justify-content: center; padding: 0 96px; box-sizing: border-box; }
        .lf-reset-inner { position: relative; width: 100%; min-height: 100vh; border-left: 1px solid var(--white-20); border-right: 1px solid var(--white-20); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 145px 32px 161px; box-sizing: border-box; overflow: hidden; }
        .lf-reset-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 32px; width: 100%; }
        .lf-reset-logo { width: 220px; height: auto; display: block; }
        .lf-reset-card { background: var(--surface-base); border: 1px solid var(--white-5); border-radius: 8px; max-width: 466px; width: 100%; padding: 17px 33px 33px; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box; }
        @media (max-width: 768px) { .lf-reset-outer { padding: 0; } .lf-reset-inner { border-left-color: var(--white-10); border-right-color: var(--white-10); padding: 145px 20px 161px; } .lf-reset-logo { width: 180px; } }
      `}</style>
      <div className="lf-reset-outer">
        <div className="lf-reset-inner">
          <img src={landscapeImg} alt="" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", pointerEvents: "none", userSelect: "none" }} />
          <div className="lf-reset-content">
            <img src={logoImg} alt="Lumen Fidei" className="lf-reset-logo" />
            <div className="lf-reset-card">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
