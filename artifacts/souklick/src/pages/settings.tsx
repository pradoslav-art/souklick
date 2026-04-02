import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Shield, Bell, MessageSquare, Zap } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandVoiceSettings from "./settings/brand-voice";
import NotificationSettings from "./settings/notifications";

interface SettingsProps {
  tab?: string;
}

export default function Settings({ tab = "brand-voice" }: SettingsProps) {
  const [, setLocation] = useLocation();

  const handleTabChange = (value: string) => {
    setLocation(`/settings/${value}`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your brand identity, AI behavior, and account preferences.</p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-8 w-full grid grid-cols-3 md:inline-flex md:w-auto h-auto p-1 bg-muted/50 border">
          <TabsTrigger value="brand-voice" className="py-2.5 px-2 sm:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MessageSquare className="w-4 h-4 mr-2 shrink-0 hidden sm:inline" />
            Brand Voice
          </TabsTrigger>
          <TabsTrigger value="notifications" className="py-2.5 px-2 sm:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2 shrink-0 hidden sm:inline" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="platforms" className="py-2.5 px-2 sm:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Zap className="w-4 h-4 mr-2 shrink-0 hidden sm:inline" />
            Platforms
          </TabsTrigger>
        </TabsList>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <TabsContent value="brand-voice" className="m-0 p-0 outline-none">
            <BrandVoiceSettings />
          </TabsContent>
          <TabsContent value="notifications" className="m-0 p-0 outline-none">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="platforms" className="m-0 p-8 outline-none text-center">
            <div className="py-12 flex flex-col items-center">
              <Shield className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold mb-2">Connected Integrations</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Platform connections are currently managed by your account executive. Please contact support to add or modify connections to Google, Zomato, or TripAdvisor.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}