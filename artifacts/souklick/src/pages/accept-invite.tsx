import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  fullName: z.string().min(2, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid invite link</h2>
          <p className="text-muted-foreground text-sm">This link is missing or invalid. Ask your team owner to send a new invite.</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName: data.fullName, password: data.password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to accept invite");
      setDone(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
            style={{ background: "linear-gradient(145deg, hsl(25,95%,58%), hsl(25,95%,46%))" }}>
            S
          </div>
          <span className="text-xl font-semibold tracking-tight">Souklick</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're in!</h2>
            <p className="text-muted-foreground text-sm mb-8">Your account has been created. Sign in to get started.</p>
            <Button className="w-full" onClick={() => setLocation("/login")}>Go to sign in</Button>
          </div>
        ) : (
          <>
            <h2 className="text-[26px] font-bold tracking-tight mb-1">Accept your invite</h2>
            <p className="text-sm text-muted-foreground mb-8">Set up your name and password to join the team.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-semibold"
                  style={{ background: "linear-gradient(160deg, hsl(25,95%,55%), hsl(25,95%,46%))" }}
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create my account
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
