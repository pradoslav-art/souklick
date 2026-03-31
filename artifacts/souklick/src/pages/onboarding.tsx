import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building, 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  Loader2,
  MapPin,
  ChevronRight
} from "lucide-react";
import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";
import { 
  useCreateLocation, 
  useUpdateOrganization,
  useGetMyOrganization,
  getGetMyOrganizationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const locationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().optional(),
});

const brandVoiceSchema = z.object({
  brandVoiceFormality: z.enum(["casual", "balanced", "professional"]),
  brandVoiceEmojis: z.enum(["never", "sometimes", "often"]),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  
  const createLocation = useCreateLocation();
  const updateOrg = useUpdateOrganization();
  const { data: org } = useGetMyOrganization({ query: { queryKey: getGetMyOrganizationQueryKey() } });

  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", address: "" },
  });

  const voiceForm = useForm<z.infer<typeof brandVoiceSchema>>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: { brandVoiceFormality: "balanced", brandVoiceEmojis: "never" },
  });

  const togglePlatform = (platform: string) => {
    setConnectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleNextStep = () => {
    setStep(s => Math.min(s + 1, 3));
  };

  const handleAddLocation = (data: z.infer<typeof locationSchema>) => {
    createLocation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Location Added", description: "Successfully added " + data.name });
          locationForm.reset();
          handleNextStep();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to add location" });
        }
      }
    );
  };

  const handleComplete = (data: z.infer<typeof brandVoiceSchema>) => {
    updateOrg.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyOrganizationQueryKey() });
          toast({ 
            title: "Setup Complete!", 
            description: "Welcome to your command center.",
            className: "bg-green-50 border-green-200"
          });
          setLocation("/");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to save settings" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">Souklick Setup</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Step {step} of 3
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-2xl">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-12 relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted -z-10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${(step - 1) * 50}%` }}
              />
            </div>
            
            {[
              { num: 1, icon: Zap, label: "Connect Platforms" },
              { num: 2, icon: Building, label: "Add Locations" },
              { num: 3, icon: MessageSquare, label: "Brand Voice" },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step > s.num ? "bg-primary border-primary text-primary-foreground" :
                  step === s.num ? "bg-card border-primary text-primary shadow-sm" :
                  "bg-card border-muted text-muted-foreground"
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-semibold ${
                  step >= s.num ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <Card className="border-border shadow-md">
            <CardContent className="p-8">
              
              {/* Step 1: Connect Platforms */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Where do your customers review you?</h2>
                    <p className="text-muted-foreground">
                      Connect your review sources to pull them into your unified inbox.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {[
                      { id: "google", name: "Google Business", icon: SiGoogle, color: "text-[#4285F4]" },
                      { id: "zomato", name: "Zomato", icon: SiZomato, color: "text-[#E23744]" },
                      { id: "tripadvisor", name: "TripAdvisor", icon: SiTripadvisor, color: "text-[#00AF87]" },
                    ].map(platform => (
                      <div 
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          connectedPlatforms.includes(platform.id) 
                            ? "border-primary bg-primary/5" 
                            : "border-muted hover:border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg bg-background shadow-sm border ${platform.color}`}>
                            <platform.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold">{platform.name}</h3>
                            <p className="text-xs text-muted-foreground">Pull reviews & ratings</p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                          connectedPlatforms.includes(platform.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted"
                        }`}>
                          {connectedPlatforms.includes(platform.id) && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleNextStep} size="lg" className="gap-2">
                      {connectedPlatforms.length > 0 ? "Continue" : "Skip for now"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Add Locations */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Let's add your first location</h2>
                    <p className="text-muted-foreground">
                      You can add more locations later from your dashboard.
                    </p>
                  </div>

                  <Form {...locationForm}>
                    <form onSubmit={locationForm.handleSubmit(handleAddLocation)} className="space-y-6">
                      <FormField
                        control={locationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Location Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Saffron Kitchen Downtown" className="text-lg py-6" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={locationForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Address (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input placeholder="Full street address" className="pl-10 py-6" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center justify-between pt-4">
                        <Button type="button" variant="ghost" onClick={handleNextStep}>
                          Skip for now
                        </Button>
                        <Button type="submit" size="lg" disabled={createLocation.isPending} className="gap-2">
                          {createLocation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Add Location
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {/* Step 3: Brand Voice */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Define your AI persona</h2>
                    <p className="text-muted-foreground">
                      How should Souklick respond to your customers?
                    </p>
                  </div>

                  <Form {...voiceForm}>
                    <form onSubmit={voiceForm.handleSubmit(handleComplete)} className="space-y-8">
                      <FormField
                        control={voiceForm.control}
                        name="brandVoiceFormality"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-base font-semibold">Tone & Formality</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <RadioGroupItem value="casual" className="peer sr-only" />
                                  </FormControl>
                                  <Label
                                    htmlFor="casual"
                                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center h-full"
                                    onClick={() => field.onChange("casual")}
                                  >
                                    <span className="font-bold mb-1">Casual</span>
                                    <span className="text-xs text-muted-foreground font-normal">Warm, friendly, uses first names.</span>
                                  </Label>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <RadioGroupItem value="balanced" className="peer sr-only" />
                                  </FormControl>
                                  <Label
                                    htmlFor="balanced"
                                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center h-full"
                                    onClick={() => field.onChange("balanced")}
                                  >
                                    <span className="font-bold mb-1">Balanced</span>
                                    <span className="text-xs text-muted-foreground font-normal">Professional but welcoming.</span>
                                  </Label>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <RadioGroupItem value="professional" className="peer sr-only" />
                                  </FormControl>
                                  <Label
                                    htmlFor="professional"
                                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center h-full"
                                    onClick={() => field.onChange("professional")}
                                  >
                                    <span className="font-bold mb-1">Formal</span>
                                    <span className="text-xs text-muted-foreground font-normal">Structured, polite, and corporate.</span>
                                  </Label>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
                          <MessageSquare className="w-4 h-4" /> AI Preview
                        </p>
                        <p className="text-sm text-foreground/80 italic">
                          {voiceForm.watch("brandVoiceFormality") === "casual" && "Hi there! Thanks so much for stopping by. We're thrilled you had a great time!"}
                          {voiceForm.watch("brandVoiceFormality") === "balanced" && "Dear customer, thank you for your visit and for taking the time to review us."}
                          {voiceForm.watch("brandVoiceFormality") === "professional" && "Dear Guest, we appreciate your patronage and value your constructive feedback."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                          Back
                        </Button>
                        <Button type="submit" size="lg" disabled={updateOrg.isPending} className="gap-2 shadow-md">
                          {updateOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Complete Setup
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}