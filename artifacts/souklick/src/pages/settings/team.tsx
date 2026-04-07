import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Trash2, Crown, Shield, User } from "lucide-react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["manager", "staff"]),
});

const ROLE_ICONS = { owner: Crown, manager: Shield, staff: User };
const ROLE_COLORS = { owner: "text-amber-600 bg-amber-50", manager: "text-blue-600 bg-blue-50", staff: "text-muted-foreground bg-muted" };

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, { credentials: "include", ...options });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Request failed");
  return body;
}

export default function TeamSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: currentUser } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const isOwner = (currentUser as any)?.role === "owner";

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => apiFetch("/team"),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: z.infer<typeof inviteSchema>) =>
      apiFetch("/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Invite sent!", description: "They'll receive an email with a link to join.", className: "bg-green-50 border-green-200" });
      setInviteOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to send invite", description: err?.message });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/team/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Member removed" });
      setRemovingId(null);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to remove member", description: err?.message });
      setRemovingId(null);
    },
  });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "manager" },
  });

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Team Members</h2>
          <p className="text-sm text-muted-foreground">Manage who has access to your organisation.</p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)} size="sm" className="gap-2">
            <UserPlus className="w-4 h-4" /> Invite member
          </Button>
        )}
      </div>

      {/* Members list */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="divide-y">
            {(members as any[]).map((member) => {
              const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] ?? User;
              const isMe = member.id === (currentUser as any)?.id;
              return (
                <div key={member.id} className="flex items-center gap-3 px-5 py-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {member.fullName?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{member.fullName}</p>
                      {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.staff}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span className="capitalize">{member.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block w-24 text-right shrink-0">
                    {member.createdAt ? format(new Date(member.createdAt), "MMM d, yyyy") : "—"}
                  </p>
                  {isOwner && !isMe && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      disabled={removingId === member.id}
                      onClick={() => {
                        setRemovingId(member.id);
                        removeMutation.mutate(member.id);
                      }}
                    >
                      {removingId === member.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              They'll receive an email with a link to set up their account. The link expires in 48 hours.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="colleague@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manager">Manager — can manage locations and respond to reviews</SelectItem>
                        <SelectItem value="staff">Staff — can respond to reviews only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={inviteMutation.isPending} className="gap-2">
                  {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Send invite
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
