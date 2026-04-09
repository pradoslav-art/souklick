import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Star, MessageSquare, Pencil, Loader2, X, Send, QrCode } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetLocation,
  getGetLocationQueryKey,
  useGetReviews,
  getGetReviewsQueryKey,
  useUpdateLocation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import ReviewCard from "@/components/review-card";
import CompetitorsSection from "@/components/competitors-section";
import QrCodeModal from "@/components/qr-code-modal";
import WidgetEmbed from "@/components/widget-embed";

const editSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().optional(),
  googlePlaceId: z.string().optional(),
  zomatoRestaurantId: z.string().optional(),
  tripadvisorLocationId: z.string().optional(),
});

const requestSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  platform: z.string().min(1, "Select a platform"),
});

interface LocationDetailProps {
  locationId: string;
}

export default function LocationDetail({ locationId }: LocationDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [platform, setPlatform] = useState("all");
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: location, isLoading: loadingLocation } = useGetLocation(locationId, {
    query: { queryKey: getGetLocationQueryKey(locationId) },
  });

  const queryParams = useMemo(() => ({
    locationId,
    limit: 100,
    ...(platform !== "all" && { platform: platform as any }),
    ...(rating !== "all" && { rating: parseInt(rating, 10) }),
    ...(status !== "all" && { status: status as any }),
  }), [locationId, platform, rating, status]);

  const { data: reviewData, isLoading: loadingReviews } = useGetReviews(queryParams, {
    query: { queryKey: getGetReviewsQueryKey(queryParams) },
  });

  const hasActiveFilters = platform !== "all" || rating !== "all" || status !== "all";

  const clearFilters = () => {
    setPlatform("all");
    setRating("all");
    setStatus("all");
  };

  const updateLocation = useUpdateLocation();

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { customerName: "", customerEmail: "", platform: "" },
  });

  const onSendRequest = async (data: z.infer<typeof requestSchema>) => {
    setSendingRequest(true);
    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, ...data }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to send");
      }
      toast({ title: "Request sent!", description: `Email sent to ${data.customerEmail}.`, className: "bg-green-50 border-green-200" });
      requestForm.reset();
      setRequestOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send", description: err.message });
    } finally {
      setSendingRequest(false);
    }
  };

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    values: {
      name: location?.name ?? "",
      address: location?.address ?? "",
      googlePlaceId: location?.googlePlaceId ?? "",
      zomatoRestaurantId: location?.zomatoRestaurantId ?? "",
      tripadvisorLocationId: (location as any)?.tripadvisorLocationId ?? "",
    },
  });

  const onSave = (data: z.infer<typeof editSchema>) => {
    updateLocation.mutate(
      { id: locationId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLocationQueryKey(locationId) });
          toast({ title: "Location updated", className: "bg-green-50 border-green-200" });
          setEditOpen(false);
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Failed to update", description: err?.message });
        },
      }
    );
  };

  const reviews = reviewData?.reviews ?? [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link href="/locations">
        <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All locations
        </div>
      </Link>

      {/* Location header */}
      {loadingLocation ? (
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : location ? (
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{location.name}</h1>
              {location.address && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {location.address}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={location.isActive ? "default" : "secondary"}
                className={location.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-none" : ""}
              >
                {location.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              {location.googlePlaceId && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setQrOpen(true)}>
                  <QrCode className="w-3.5 h-3.5" /> QR Code
                </Button>
              )}
              <Button size="sm" className="gap-1.5" onClick={() => setRequestOpen(true)}>
                <Send className="w-3.5 h-3.5" /> Request Review
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 p-4 bg-card border rounded-xl shadow-md">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{location.averageRating?.toFixed(1) ?? "—"}</span>
              <span className="text-sm text-muted-foreground">avg rating</span>
            </div>
            <div className="w-px h-5 bg-border hidden sm:block" />
            <div>
              <span className="font-bold">{location.reviewCount}</span>
              <span className="text-sm text-muted-foreground ml-1.5">reviews</span>
            </div>
            <div className="w-px h-5 bg-border hidden sm:block" />
            <div>
              <span className={`font-bold ${location.responseRate > 80 ? "text-green-600" : location.responseRate < 50 ? "text-destructive" : ""}`}>
                {location.responseRate}%
              </span>
              <span className="text-sm text-muted-foreground ml-1.5">response rate</span>
            </div>
            {(location.googlePlaceId || location.zomatoRestaurantId || (location as any).tripadvisorLocationId) && (
              <>
                <div className="w-px h-5 bg-border hidden sm:block" />
                <div className="flex gap-2 flex-wrap">
                  {location.googlePlaceId && <Badge variant="outline" className="text-xs bg-white">Google</Badge>}
                  {location.zomatoRestaurantId && <Badge variant="outline" className="text-xs bg-white">Zomato</Badge>}
                  {(location as any).tripadvisorLocationId && <Badge variant="outline" className="text-xs bg-white">TripAdvisor</Badge>}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mb-8">Location not found.</p>
      )}

      {/* Reviews */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold mr-auto">Reviews</h2>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="zomato">Zomato</SelectItem>
              <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="w-[110px] h-8 text-sm">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="3">3 stars</SelectItem>
              <SelectItem value="2">2 stars</SelectItem>
              <SelectItem value="1">1 star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="draft_saved">Draft saved</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
        {loadingReviews ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-[220px] p-5 border-b md:border-b-0 md:border-r border-border bg-muted/20">
                    <Skeleton className="h-6 w-20 rounded-md mb-4" />
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-5">
                    <Skeleton className="h-3.5 w-full mb-2" />
                    <Skeleton className="h-3.5 w-5/6 mb-6" />
                    <Skeleton className="h-8 w-28 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card/50">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
            {hasActiveFilters ? (
              <>
                <p className="font-medium mb-1">No reviews match these filters</p>
                <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear filters</button>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">No reviews yet</p>
                <p className="text-sm text-muted-foreground">Reviews for this location will appear here once they come in.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Competitors */}
      {location && (
        <CompetitorsSection
          locationId={locationId}
          locationName={location.name}
          locationRating={(location as any).averageRating ?? null}
        />
      )}

      {/* Widget embed */}
      {location && (
        <WidgetEmbed locationId={locationId} initialToken={(location as any).widgetToken ?? null} />
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit location</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 pt-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Downtown Branch" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Full street address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">Platform IDs</p>
                <FormField
                  control={form.control}
                  name="googlePlaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Google Place ID</FormLabel>
                      <FormControl><Input placeholder="ChIJ…" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zomatoRestaurantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Zomato Restaurant ID</FormLabel>
                      <FormControl><Input placeholder="1234567" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tripadvisorLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">TripAdvisor Location ID</FormLabel>
                      <FormControl><Input placeholder="d12345678" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateLocation.isPending}>
                  {updateLocation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* QR Code modal */}
      {location?.googlePlaceId && (
        <QrCodeModal
          open={qrOpen}
          onOpenChange={setQrOpen}
          locationName={location.name}
          googlePlaceId={location.googlePlaceId}
        />
      )}

      {/* Request Review dialog */}
      <Dialog open={requestOpen} onOpenChange={(open) => { setRequestOpen(open); if (!open) requestForm.reset(); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Request a review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Enter the customer's details and we'll email them a direct link to leave a review.
          </p>
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(onSendRequest)} className="space-y-4 pt-1">
              <FormField
                control={requestForm.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Sarah" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requestForm.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email</FormLabel>
                    <FormControl><Input type="email" placeholder="customer@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requestForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose platform…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {location?.googlePlaceId && <SelectItem value="google">Google</SelectItem>}
                        {location?.zomatoRestaurantId && <SelectItem value="zomato">Zomato</SelectItem>}
                        {(location as any)?.tripadvisorLocationId && <SelectItem value="tripadvisor">TripAdvisor</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={sendingRequest} className="gap-2">
                  {sendingRequest && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send request
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
