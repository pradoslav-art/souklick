import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
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
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      // Always show success — never reveal whether the email exists
      setSent(true);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
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

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm mb-8">
              If an account exists for that address, we've sent a password reset link. It expires in 1 hour.
            </p>
            <button
              onClick={() => setLocation("/login")}
              className="text-sm text-primary hover:underline underline-offset-4 font-medium"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-[26px] font-bold tracking-tight mb-1">Reset your password</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@company.com"
                          className="h-11 rounded-xl"
                          {...field}
                        />
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
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send reset link
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <button
                onClick={() => setLocation("/login")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
