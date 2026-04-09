import { useState, useMemo } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useGetReviews,
  getGetReviewsQueryKey,
  useGetLocations,
  getGetLocationsQueryKey,
  GetReviewsPlatform,
  GetReviewsStatus
} from "@workspace/api-client-react";
import { Search, SlidersHorizontal, MessageSquare, Loader2, MapPin, CheckSquare, Download } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import ReviewCard from "@/components/review-card";
import OnboardingChecklist from "@/components/onboarding-checklist";
import BulkActionBar from "@/components/bulk-action-bar";

function ReviewCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[220px] p-5 border-b md:border-b-0 md:border-r border-border bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-full mb-1.5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex-1 p-5">
          <Skeleton className="h-3.5 w-full mb-2" />
          <Skeleton className="h-3.5 w-5/6 mb-2" />
          <Skeleton className="h-3.5 w-4/6 mb-6" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [platform, setPlatform] = useState<GetReviewsPlatform | "all">("all");
  const [locationId, setLocationId] = useState<string>("all");
  const [rating, setRating] = useState<string>("all");
  const [status, setStatus] = useState<GetReviewsStatus | "all">("all");
  const [tag, setTag] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleExport = () => {
    const params = new URLSearchParams();
    if (platform !== "all") params.set("platform", platform);
    if (locationId !== "all") params.set("locationId", locationId);
    if (rating !== "all") params.set("rating", rating);
    if (status !== "all") params.set("status", status);
    window.location.href = `/api/reviews/export?${params.toString()}`;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data: locations } = useGetLocations({ query: { queryKey: getGetLocationsQueryKey() } });

  const queryParams = useMemo(() => {
    const params: any = { page, limit: 20 };
    if (platform !== "all") params.platform = platform;
    if (locationId !== "all") params.locationId = locationId;
    if (rating !== "all") params.rating = Number(rating);
    if (status !== "all") params.status = status;
    return params;
  }, [platform, locationId, rating, status, page]);

  const { data: reviewData, isLoading } = useGetReviews(queryParams, {
    query: { queryKey: getGetReviewsQueryKey(queryParams), placeholderData: keepPreviousData }
  });

  const reviews = reviewData?.reviews || [];
  const hasActiveFilters = platform !== "all" || locationId !== "all" || rating !== "all" || status !== "all" || tag !== "all" || !!search;

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (tag !== "all") {
      result = result.filter(r => (r.tags ?? []).includes(tag));
    }
    if (!search) return result;
    const lowerSearch = search.toLowerCase();
    return result.filter(r =>
      r.reviewerName.toLowerCase().includes(lowerSearch) ||
      (r.reviewText && r.reviewText.toLowerCase().includes(lowerSearch)) ||
      r.locationName.toLowerCase().includes(lowerSearch)
    );
  }, [reviews, search, tag]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Unified Inbox</h1>
          <p className="text-muted-foreground">Manage your brand reputation across all locations.</p>
        </div>
        <div className="flex items-center gap-2">
          {filteredReviews.length > 0 && (
            <Button
              variant={selectedIds.size > 0 ? "secondary" : "outline"}
              onClick={() => setSelectedIds(selectedIds.size > 0 ? new Set() : new Set(filteredReviews.map(r => r.id)))}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select"}
            </Button>
          )}
          {reviews.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Link href="/priority">
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <MessageSquare className="w-4 h-4 mr-2" />
              Priority Queue
            </Button>
          </Link>
        </div>
      </div>

      <OnboardingChecklist />

      <div className="bg-card border border-border rounded-xl shadow-md mb-6 p-4">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews or customers..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters — 2-column grid on mobile, single row on desktop */}
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <Select value={platform} onValueChange={(v) => { setPlatform(v as any); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[140px] bg-background">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="zomato">Zomato</SelectItem>
              <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationId} onValueChange={(v) => { setLocationId(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[180px] bg-background">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations?.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rating} onValueChange={(v) => { setRating(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[120px] bg-background">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="draft_saved">Draft Saved</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tag} onValueChange={(v) => { setTag(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[140px] bg-background">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="cleanliness">Cleanliness</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="wait time">Wait Time</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selectedIds)}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      <div className="pb-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <ReviewCardSkeleton key={i} />)}
          </div>
        ) : filteredReviews.length === 0 ? (
          !hasActiveFilters ? (
            // New user — no reviews at all
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card/50">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Your inbox is empty</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Reviews will appear here once your locations are connected. Start by adding your first location.
              </p>
              <Link href="/locations">
                <Button className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Add a location
                </Button>
              </Link>
            </div>
          ) : (
            // Filters returned nothing
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card/50">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-muted-foreground max-w-md">
                No reviews match your current filters. Try adjusting your search or clearing filters.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setPlatform("all");
                  setLocationId("all");
                  setRating("all");
                  setStatus("all");
                  setTag("all");
                  setSearch("");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                selected={selectedIds.has(review.id)}
                onToggleSelect={toggleSelect}
                selectMode={selectedIds.size > 0}
              />
            ))}

            {reviewData?.totalPages && reviewData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium px-4">
                  Page {page} of {reviewData.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= reviewData.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
