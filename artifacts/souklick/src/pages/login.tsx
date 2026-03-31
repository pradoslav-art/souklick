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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    loginMutation.mutate(
      { data },
      {
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
      }
    );
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data },
      {
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
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="hidden md:flex flex-col flex-1 bg-primary text-primary-foreground p-12 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-primary font-bold text-2xl">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight">Souklick</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 max-w-lg">
            Stop pasting.<br />Start engaging.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            The command center for hospitality leaders to manage brand reputation across all locations in seconds.
          </p>
        </div>
        <div className="bg-white/10 p-6 rounded-xl border border-white/20 backdrop-blur-sm max-w-md">
          <p className="text-sm italic mb-4">
            "Souklick saved our area managers almost 10 hours a week. Instead of fighting with browser tabs, they're actually responding to our guests."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              AK
            </div>
            <div>
              <p className="font-semibold text-sm">Amir K.</p>
              <p className="text-xs text-primary-foreground/70">Operations Director, Saffron Kitchen</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-lg">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Souklick</span>
          </div>

          <Card className="border-none shadow-xl bg-card">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <CardHeader className="px-6 pt-6 pb-0">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="login" className="m-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)}>
                    <CardContent className="space-y-4 px-6 py-2">
                      <div className="mb-4">
                        <CardTitle className="text-2xl mb-1">Welcome back</CardTitle>
                        <CardDescription>Enter your details to access your dashboard.</CardDescription>
                      </div>
                      
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@company.com" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Sign in
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="m-0">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)}>
                    <CardContent className="space-y-4 px-6 py-2">
                      <div className="mb-4">
                        <CardTitle className="text-2xl mb-1">Create an account</CardTitle>
                        <CardDescription>Get started with Souklick in seconds.</CardDescription>
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                            <FormLabel>Restaurant Group Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Saffron Kitchen LLC" {...field} />
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
                            <FormLabel>Work Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@company.com" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create Account
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}