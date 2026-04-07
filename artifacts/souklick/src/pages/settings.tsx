import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Bell, MessageSquare, Zap, CreditCard, User, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandVoiceSettings from "./settings/brand-voice";
import NotificationSettings from "./settings/notifications";
import BillingSettings from "./settings/billing";
import ProfileSettings from "./settings/profile";
import PlatformSettings from "./settings/platforms";
import TeamSettings from "./settings/team";

interface SettingsProps {
  tab?: string;
}

export default function Settings({ tab = "profile" }: SettingsProps) {
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
          <TabsTrigger value="profile" className="py-2.5 px-2 sm:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2 shrink-0 hidden sm:inline" />
            Profile
          </TabsTrigger>
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
          <TabsTrigger value="billing" className="py-2.5 px-2 sm:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4 mr-2 shrink-0 hidden sm:inline" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="py-2.5 px-2 sm:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2 shrink-0 hidden sm:inline" />
            Team
          </TabsTrigger>
        </TabsList>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <TabsContent value="profile" className="m-0 p-0 outline-none">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="brand-voice" className="m-0 p-0 outline-none">
            <BrandVoiceSettings />
          </TabsContent>
          <TabsContent value="notifications" className="m-0 p-0 outline-none">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="billing" className="m-0 p-0 outline-none">
            <BillingSettings />
          </TabsContent>
          <TabsContent value="platforms" className="m-0 p-0 outline-none">
            <PlatformSettings />
          </TabsContent>
          <TabsContent value="team" className="m-0 p-0 outline-none">
            <TeamSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}