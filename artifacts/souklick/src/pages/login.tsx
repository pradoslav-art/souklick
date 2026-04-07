import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useLoginUser, useRegisterUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required." }),
  organizationName: z.string().min(2, { message: "Organization name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", organizationName: "", email: "", password: "" },
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error?.message || "Please check your credentials and try again.",
        });
      },
    });
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setLocation("/onboarding");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error?.message || "An error occurred during registration.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">

      {/* ── Left panel — brand story ── */}
      <div className="hidden md:flex flex-col flex-1 p-14 justify-between relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, hsl(25,95%,48%) 0%, hsl(20,95%,38%) 100%)"
        }}>

        {/* Subtle texture circles */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl text-white border border-white/20">
              S
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Souklick</span>
          </div>

          <h1 className="text-[44px] font-bold leading-[1.1] text-white mb-5 tracking-tight max-w-sm">
            Stop pasting.<br />Start engaging.
          </h1>
          <p className="text-[17px] text-white/75 max-w-xs leading-relaxed">
            The command centre for hospitality leaders managing reputation across every location.
          </p>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 max-w-sm">
          <p className="text-[15px] text-white/90 italic leading-relaxed mb-5">
            "Souklick saved our area managers almost 10 hours a week. Instead of fighting with browser tabs, they're actually responding to guests."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-white text-sm font-semibold">
              AK
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Amir K.</p>
              <p className="text-xs text-white/60">Operations Director, Saffron Kitchen</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — forms ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: "linear-gradient(145deg, hsl(25,95%,58%), hsl(25,95%,46%))" }}>
              S
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">Souklick</span>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            {/* Tab switcher */}
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted rounded-xl p-1">
              <TabsTrigger value="login" className="rounded-lg text-[13px] font-medium">Sign in</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-[13px] font-medium">Create account</TabsTrigger>
            </TabsList>

            {/* ── Login ── */}
            <TabsContent value="login" className="m-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                  <div className="mb-6">
                    <h2 className="text-[26px] font-bold tracking-tight text-foreground mb-1">Welcome back</h2>
                    <p className="text-[14px] text-muted-foreground">Enter your details to continue.</p>
                  </div>

                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground/80">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@company.com" className="h-11 rounded-xl bg-card border-border/70 focus-visible:ring-primary/40 text-[14px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[13px] font-medium text-foreground/80">Password</FormLabel>
                          <a href="/forgot-password" className="text-[12px] text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
                            Forgot password?
                          </a>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-11 rounded-xl bg-card border-border/70 focus-visible:ring-primary/40 text-[14px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold text-[14px] tracking-tight mt-2"
                    style={{ background: "linear-gradient(160deg, hsl(25,95%,55%), hsl(25,95%,46%))" }}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sign in
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* ── Register ── */}
            <TabsContent value="register" className="m-0">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="mb-6">
                    <h2 className="text-[26px] font-bold tracking-tight text-foreground mb-1">Get started</h2>
                    <p className="text-[14px] text-muted-foreground">Create your Souklick account in seconds.</p>
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground/80">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="h-11 rounded-xl bg-card border-border/70 focus-visible:ring-primary/40 text-[14px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground/80">Restaurant Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Saffron Kitchen LLC" className="h-11 rounded-xl bg-card border-border/70 focus-visible:ring-primary/40 text-[14px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground/80">Work Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@company.com" className="h-11 rounded-xl bg-card border-border/70 focus-visible:ring-primary/40 text-[14px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground/80">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-11 rounded-xl bg-card border-border/70 focus-visible:ring-primary/40 text-[14px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold text-[14px] tracking-tight mt-2"
                    style={{ background: "linear-gradient(160deg, hsl(25,95%,55%), hsl(25,95%,46%))" }}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Account
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
