import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import loginBackground from "@/assets/images/login-bg.png";
import lumenIcon from "@/assets/images/lumen-icon.png";

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
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') setLocation('/admin');
      else if (user.role === 'mentor') setLocation('/mentor');
      else setLocation('/dashboard');
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
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-md space-y-6 animate-in zoom-in-95 duration-500">
        <Card className="border border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="space-y-2">
              <img 
                src={lumenIcon} 
                alt="Lumen Fidei" 
                className="w-20 h-20 mx-auto rounded-xl"
                data-testid="img-lumen-icon"
              />
              <h1 className="font-serif text-3xl font-bold text-black">Lumen Fidei</h1>
              <p className="text-muted-foreground text-sm">30-Day Spiritual Journey</p>
            </div>
            <div className="pt-4 border-t border-border">
              <CardTitle className="text-xl text-black">Welcome Back</CardTitle>
              <CardDescription className="mt-1">
                Enter your credentials to continue your journey
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  {...form.register("username")}
                  className="bg-white"
                  data-testid="input-email"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  {...form.register("password")}
                  className="bg-white"
                  data-testid="input-password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={form.formState.isSubmitting}
                data-testid="button-login"
              >
                {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Having trouble? Contact your mentor.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
