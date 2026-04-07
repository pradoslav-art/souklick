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
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Reset failed");
      setDone(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid link</h2>
          <p className="text-muted-foreground text-sm mb-6">This password reset link is missing or invalid.</p>
          <Button onClick={() => setLocation("/forgot-password")}>Request a new link</Button>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold mb-2">Password updated</h2>
            <p className="text-muted-foreground text-sm mb-8">Your password has been changed. You can now sign in.</p>
            <Button className="w-full" onClick={() => setLocation("/login")}>Go to sign in</Button>
          </div>
        ) : (
          <>
            <h2 className="text-[26px] font-bold tracking-tight mb-1">Set new password</h2>
            <p className="text-sm text-muted-foreground mb-8">Choose a new password of at least 8 characters.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-foreground/80">New Password</FormLabel>
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
                      <FormLabel className="text-[13px] font-medium text-foreground/80">Confirm Password</FormLabel>
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
                  Set new password
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
