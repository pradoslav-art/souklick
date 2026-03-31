import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { 
  useGetNotificationPreferences, 
  useUpdateNotificationPreferences,
  getGetNotificationPreferencesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const notifySchema = z.object({
  notificationEmail: z.boolean(),
  notificationPush: z.boolean(),
  notificationMinRating: z.number().min(1).max(5),
});

export default function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: prefs, isLoading } = useGetNotificationPreferences({
    query: { queryKey: getGetNotificationPreferencesQueryKey() }
  });
  
  const updatePrefs = useUpdateNotificationPreferences();

  const form = useForm<z.infer<typeof notifySchema>>({
    resolver: zodResolver(notifySchema),
    defaultValues: {
      notificationEmail: true,
      notificationPush: false,
      notificationMinRating: 3,
    },
  });

  useEffect(() => {
    if (prefs) {
      form.reset({
        notificationEmail: prefs.notificationEmail,
        notificationPush: prefs.notificationPush,
        notificationMinRating: prefs.notificationMinRating,
      });
    }
  }, [prefs, form]);

  const onSubmit = (data: z.infer<typeof notifySchema>) => {
    updatePrefs.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
          toast({ 
            title: "Preferences Saved", 
            description: "Your notification settings have been updated.",
            className: "bg-green-50 border-green-200"
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Alert Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Control when and how you are notified about new reviews.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
            <FormField
              control={form.control}
              name="notificationEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Alerts</FormLabel>
                    <FormDescription>
                      Receive a daily digest of new priority reviews.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="h-px bg-border w-full" />

            <FormField
              control={form.control}
              name="notificationPush"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Real-time Push</FormLabel>
                    <FormDescription>
                      Get instant browser notifications for critical reviews.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
            <FormField
              control={form.control}
              name="notificationMinRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Alert Threshold</FormLabel>
                  <FormDescription className="mb-3">
                    Only notify me when a review rating is at or below this threshold.
                  </FormDescription>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a threshold" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">All reviews (1-5 stars)</SelectItem>
                      <SelectItem value="4">4 stars and below</SelectItem>
                      <SelectItem value="3">3 stars and below (Recommended)</SelectItem>
                      <SelectItem value="2">2 stars and below</SelectItem>
                      <SelectItem value="1">1 star only</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={updatePrefs.isPending || !form.formState.isDirty} className="shadow-sm">
            {updatePrefs.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save Preferences
          </Button>
        </form>
      </Form>
    </div>
  );
}