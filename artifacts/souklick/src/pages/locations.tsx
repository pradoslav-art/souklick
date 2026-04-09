import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetLocations,
  useCreateLocation,
  getGetLocationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, MapPin, Star, MessageSquare, ArrowRight, Building, Loader2,
  AlertCircle, TrendingUp, CheckCircle2, ChevronDown
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().optional(),
  googlePlaceId: z.string().optional(),
  zomatoRestaurantId: z.string().optional(),
});

type SortKey = "pending" | "rating" | "name";

function StarRating({ rating }: { rating: number | null }) {
  const value = rating ?? 0;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-300" : "text-muted-foreground/20"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function LocationCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-4 divide-x border-b">
        {[...Array(4)].map((_, j) => (
          <div key={j} className="p-4 flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
      <div className="p-4 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}

export default function Locations() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading } = useGetLocations({
    query: { queryKey: getGetLocationsQueryKey() }
  });

  const createLocation = useCreateLocation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", address: "", googlePlaceId: "", zomatoRestaurantId: "" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createLocation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLocationsQueryKey() });
          toast({ title: "Location Added", description: "Successfully added new location." });
          setIsModalOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to add location." });
        }
      }
    );
  };

  // Summary totals
  const totals = useMemo(() => {
    if (!locations?.length) return null;
    const totalPending = locations.reduce((sum, l) => sum + ((l as any).pendingCount ?? 0), 0);
    const rated = locations.filter(l => l.averageRating != null);
    const avgRating = rated.length > 0 ? rated.reduce((s, l) => s + l.averageRating!, 0) / rated.length : null;
    const totalReviews = locations.reduce((sum, l) => sum + l.reviewCount, 0);
    return { totalPending, avgRating, totalReviews, locationCount: locations.length };
  }, [locations]);

  // Sorted locations
  const sortedLocations = useMemo(() => {
    if (!locations) return [];
    return [...locations].sort((a, b) => {
      if (sortBy === "pending") {
        const diff = ((b as any).pendingCount ?? 0) - ((a as any).pendingCount ?? 0);
        if (diff !== 0) return diff;
        return (a.averageRating ?? 0) - (b.averageRating ?? 0); // secondary: worst rating first
      }
      if (sortBy === "rating") {
        return (a.averageRating ?? 0) - (b.averageRating ?? 0); // worst first
      }
      return a.name.localeCompare(b.name);
    });
  }, [locations, sortBy]);

  const sortLabels: Record<SortKey, string> = {
    pending: "Most Pending",
    rating: "Lowest Rating",
    name: "Name (A–Z)",
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Locations Overview</h1>
          <p className="text-muted-foreground">All your locations at a glance — see where attention is needed.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Location
        </Button>
      </div>

      {/* Summary bar */}
      {!isLoading && totals && totals.locationCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Locations</p>
            <p className="text-2xl font-bold">{totals.locationCount}</p>
          </div>
          <div className={`border rounded-xl p-4 text-center shadow-sm ${totals.totalPending > 0 ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"}`}>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Pending Reviews</p>
            <p className={`text-2xl font-bold ${totals.totalPending > 0 ? "text-destructive" : ""}`}>{totals.totalPending}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Avg Rating</p>
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-2xl font-bold">{totals.avgRating != null ? totals.avgRating.toFixed(1) : "—"}</p>
              {totals.avgRating != null && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Reviews (30d)</p>
            <p className="text-2xl font-bold">{totals.totalReviews}</p>
          </div>
        </div>
      )}

      {/* Sort control */}
      {!isLoading && (sortedLocations.length > 1) && (
        <div className="flex items-center justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-sm">
                Sort: {sortLabels[sortBy]}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setSortBy("pending")}>Most Pending</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortBy("rating")}>Lowest Rating</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortBy("name")}>Name (A–Z)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <LocationCardSkeleton key={i} />)}
        </div>
      ) : sortedLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card/50">
          <Building className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Add your first location to start managing its reviews and reputation.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Add First Location</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedLocations.map((location) => {
            const pending = (location as any).pendingCount ?? 0;
            const needsAttention = pending > 0 || (location.averageRating != null && location.averageRating < 3.5);
            return (
              <div
                key={location.id}
                className={`rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md ${needsAttention && pending > 0 ? "border-destructive/30" : "border-border"}`}
              >
                {/* Header */}
                <div className={`p-5 border-b ${needsAttention && pending > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg leading-tight">{location.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pending > 0 && (
                        <Badge className="bg-destructive text-white hover:bg-destructive shadow-none text-xs gap-1 px-2 py-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {pending} pending
                        </Badge>
                      )}
                      {pending === 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-none text-xs gap-1 px-2 py-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          All clear
                        </Badge>
                      )}
                    </div>
                  </div>
                  {location.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{location.address}</span>
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x border-b">
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Rating</span>
                    {location.averageRating != null ? (
                      <>
                        <span className="text-xl font-bold leading-none mb-1">{location.averageRating.toFixed(1)}</span>
                        <StarRating rating={location.averageRating} />
                      </>
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Reviews</span>
                    <span className="text-xl font-bold leading-none mb-1">{location.reviewCount}</span>
                    <span className="text-[10px] text-muted-foreground">last 30 days</span>
                  </div>
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Response</span>
                    <span className={`text-xl font-bold leading-none mb-1 ${location.responseRate >= 80 ? "text-green-600" : location.responseRate < 50 ? "text-destructive" : "text-amber-600"}`}>
                      {location.responseRate}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">rate</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-muted/10 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {location.googlePlaceId && <Badge variant="outline" className="text-xs bg-white">Google</Badge>}
                    {location.zomatoRestaurantId && <Badge variant="outline" className="text-xs bg-white">Zomato</Badge>}
                    {location.tripadvisorLocationId && <Badge variant="outline" className="text-xs bg-white">TripAdvisor</Badge>}
                    {!location.googlePlaceId && !location.zomatoRestaurantId && !location.tripadvisorLocationId && (
                      <span className="text-xs text-muted-foreground">No platforms connected</span>
                    )}
                  </div>
                  <Link href={`/locations/${location.id}`}>
                    <Button
                      size="sm"
                      variant={pending > 0 ? "default" : "ghost"}
                      className={`gap-1 shrink-0 ${pending > 0 ? "shadow-sm" : "text-primary"}`}
                    >
                      {pending > 0 ? "Respond" : "View"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Location Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Add a new location to track its reviews.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Downtown Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Full street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium text-foreground">Platform IDs (Optional)</h4>
                <p className="text-xs text-muted-foreground">Provide platform IDs to connect review sources.</p>

                <FormField
                  control={form.control}
                  name="googlePlaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Google Place ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ChIJ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zomatoRestaurantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Zomato ID</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createLocation.isPending}>
                  {createLocation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Location
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
