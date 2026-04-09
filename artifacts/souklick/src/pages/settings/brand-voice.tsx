import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { 
  useGetMyOrganization, 
  useUpdateOrganization,
  getGetMyOrganizationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const brandVoiceSchema = z.object({
  brandVoiceFormality: z.enum(["casual", "balanced", "professional"]),
  brandVoiceEmojis: z.enum(["never", "sometimes", "often"]),
  brandVoiceSignoff: z.string().optional(),
});

export default function BrandVoiceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: org, isLoading } = useGetMyOrganization({
    query: { queryKey: getGetMyOrganizationQueryKey() }
  });
  
  const updateOrg = useUpdateOrganization();

  const form = useForm<z.infer<typeof brandVoiceSchema>>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      brandVoiceFormality: "balanced",
      brandVoiceEmojis: "never",
      brandVoiceSignoff: "",
    },
  });

  useEffect(() => {
    if (org) {
      form.reset({
        brandVoiceFormality: org.brandVoiceFormality,
        brandVoiceEmojis: org.brandVoiceEmojis,
        brandVoiceSignoff: org.brandVoiceSignoff || "",
      });
    }
  }, [org, form]);

  const onSubmit = (data: z.infer<typeof brandVoiceSchema>) => {
    updateOrg.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyOrganizationQueryKey() });
          toast({ 
            title: "Settings Saved", 
            description: "Your AI brand voice has been updated.",
            className: "bg-green-50 border-green-200 text-green-900"
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
        }
      }
    );
  };

  const formality = form.watch("brandVoiceFormality");

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-border">
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1">AI Response Persona</h2>
          <p className="text-sm text-muted-foreground">
            Configure how the AI writes draft responses. It will use these settings to match your brand's unique tone.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
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
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                          onClick={() => field.onChange("casual")}
                        >
                          <span className="font-bold mb-1">Casual</span>
                          <span className="text-xs text-muted-foreground text-center font-normal">Warm, friendly, conversational. Uses first names.</span>
                        </Label>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="balanced" className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor="balanced"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                          onClick={() => field.onChange("balanced")}
                        >
                          <span className="font-bold mb-1">Balanced</span>
                          <span className="text-xs text-muted-foreground text-center font-normal">Professional but welcoming. The standard hospitality tone.</span>
                        </Label>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem value="professional" className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor="professional"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                          onClick={() => field.onChange("professional")}
                        >
                          <span className="font-bold mb-1">Formal</span>
                          <span className="text-xs text-muted-foreground text-center font-normal">Highly structured, polite, and corporate.</span>
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandVoiceEmojis"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">Emoji Usage</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="never" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Never</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="sometimes" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Sometimes (1-2 max)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="often" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Often</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandVoiceSignoff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Standard Sign-off (Optional)</FormLabel>
                  <FormDescription>
                    Text appended to the end of every AI-generated response.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="e.g. The Acme Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateOrg.isPending || !form.formState.isDirty} className="shadow-sm">
              {updateOrg.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save Voice Settings
            </Button>
          </form>
        </Form>
      </div>

      <div className="w-full md:w-[350px] lg:w-[400px] p-8 bg-muted/20">
        <div className="flex items-center gap-2 mb-6 text-primary font-semibold">
          <Sparkles className="w-5 h-5" />
          <span>Live Preview</span>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm text-sm">
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">Example Review (5 Star)</p>
            <p className="italic mb-3">"Excellent service from Ahmed — incredibly helpful and professional. Will definitely be coming back."</p>
            <Separator className="my-3" />
            <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">AI Draft Preview</p>
            <p className="text-foreground leading-relaxed">
              {formality === "casual" && "Hi Sarah! Thanks so much for the 5 stars. We're thrilled Ahmed made such a great impression — we'll be sure to pass your kind words on to him. Can't wait to see you again!"}
              {formality === "balanced" && "Dear Sarah, thank you for your wonderful 5-star review. We are delighted to hear that Ahmed provided such excellent service. We look forward to welcoming you back soon."}
              {formality === "professional" && "Dear Guest, thank you for taking the time to leave a 5-star rating. We are pleased that your experience met expectations and that our team member Ahmed provided commendable service. We anticipate your return."}
            </p>
            {form.watch("brandVoiceSignoff") && (
              <p className="text-foreground leading-relaxed mt-2 font-medium">
                — {form.watch("brandVoiceSignoff")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}