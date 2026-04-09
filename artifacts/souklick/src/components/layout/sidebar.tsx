import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertCircle, MapPin, BarChart3, Settings, LogOut, ShieldCheck, Zap, X, CreditCard } from "lucide-react";
import {
  useLogoutUser,
  useGetPriorityCount,
  getGetPriorityCountQueryKey,
  useGetCurrentUser,
  getGetCurrentUserQueryKey
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const { data: priorityCount } = useGetPriorityCount({ query: { queryKey: getGetPriorityCountQueryKey() } });
  const logout = useLogoutUser();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  const handleNavClick = () => {
    onMobileClose?.();
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Priority Queue",
      href: "/priority",
      icon: AlertCircle,
      badge: priorityCount?.count ? priorityCount.count : 0
    },
    { name: "Locations", href: "/locations", icon: MapPin },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
    ...((user as any)?.isAdmin ? [{ name: "Admin", href: "/admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className={cn(
      "flex h-dvh w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border",
      // Mobile: fixed drawer that slides in/out
      "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
      "md:relative md:translate-x-0 md:z-auto md:transition-none",
      mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(145deg, hsl(25,95%,62%), hsl(22,90%,48%))" }}>
            S
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            Souklick
          </span>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} onClick={handleNavClick}>
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={cn(
                    "w-[17px] h-[17px] transition-colors",
                    isActive ? "text-primary" : "text-sidebar-foreground/40"
                  )} />
                  {item.name}
                </div>
                {item.badge ? (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-destructive/15 text-destructive"
                  )}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade banner for trial users */}
      {(user as any)?.subscriptionPlan === "trial" && (() => {
        const trialEndsAt = (user as any)?.trialEndsAt ? new Date((user as any).trialEndsAt) : null;
        const now = new Date();
        const expired = trialEndsAt ? trialEndsAt < now : false;
        const daysLeft = trialEndsAt && !expired
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000)
          : 0;

        return (
          <div className="px-3 pb-2">
            <Link href="/upgrade" onClick={handleNavClick}>
              <div className={`${expired ? "bg-destructive/10 hover:bg-destructive/15" : "bg-primary/10 hover:bg-primary/15"} transition-colors rounded-xl px-3 py-3 cursor-pointer`}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-3.5 h-3.5 ${expired ? "text-destructive" : "text-primary"}`} />
                  <span className={`text-[12px] font-semibold ${expired ? "text-destructive" : "text-primary"}`}>
                    {expired ? "Trial expired" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in trial`}
                  </span>
                </div>
                <p className={`text-[11px] leading-snug ${expired ? "text-destructive/70" : "text-primary/70"}`}>
                  {expired
                    ? "Upgrade now to restore access."
                    : "Upgrade to keep full access. Plans from $29/month."}
                </p>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* User */}
      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer">
              <Avatar className="h-7 w-7 ring-1 ring-border/50">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.fullName || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.fullName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sidebar-foreground truncate leading-tight">
                  {user?.fullName}
                </p>
                <p className="text-[11px] text-sidebar-foreground/45 truncate leading-tight mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setLocation("/settings"); handleNavClick(); }}>
              <Settings className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLocation("/upgrade"); handleNavClick(); }}>
              <CreditCard className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              {(user as any)?.subscriptionPlan !== "trial" ? "Manage billing" : "Upgrade plan"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
