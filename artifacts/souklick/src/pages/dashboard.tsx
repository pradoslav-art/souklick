import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  useGetReviews, 
  getGetReviewsQueryKey,
  useGetLocations,
  getGetLocationsQueryKey,
  GetReviewsPlatform,
  GetReviewsStatus
} from "@workspace/api-client-react";
import { Search, SlidersHorizontal, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import ReviewCard from "@/components/review-card";

const QUOTES = [
  { text: "Your reputation is your most valuable asset. Protect it daily.", author: "Unknown" },
  { text: "Every review is a chance to show who you really are.", author: "Unknown" },
  { text: "Customer feedback is the compass that guides great businesses.", author: "Unknown" },
  { text: "Small acts of care turn customers into loyal advocates.", author: "Unknown" },
  { text: "A single kind response can turn a critic into a champion.", author: "Unknown" },
  { text: "Excellence is not a destination but a continuous journey.", author: "Brian Tracy" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
];

const todaysQuote = QUOTES[new Date().getDay() % QUOTES.length];

export default function Dashboard() {
  const [platform, setPlatform] = useState<GetReviewsPlatform | "all">("all");
  const [locationId, setLocationId] = useState<string>("all");
  const [rating, setRating] = useState<string>("all");
  const [status, setStatus] = useState<GetReviewsStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

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
    query: { queryKey: getGetReviewsQueryKey(queryParams), keepPreviousData: true } 
  });

  const reviews = reviewData?.reviews || [];

  // Client-side search filtering since API doesn't have a search param
  const filteredReviews = useMemo(() => {
    if (!search) return reviews;
    const lowerSearch = search.toLowerCase();
    return reviews.filter(r => 
      r.reviewerName.toLowerCase().includes(lowerSearch) || 
      (r.reviewText && r.reviewText.toLowerCase().includes(lowerSearch)) ||
      r.locationName.toLowerCase().includes(lowerSearch)
    );
  }, [reviews, search]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Unified Inbox</h1>
          <p className="text-muted-foreground">Manage your brand reputation across all locations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/priority">
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <MessageSquare className="w-4 h-4 mr-2" />
              Priority Queue
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3 shadow-xs">
        <span className="text-primary text-base select-none">✦</span>
        <p className="text-[13.5px] text-foreground/70 italic leading-snug">
          "{todaysQuote.text}"
          {todaysQuote.author !== "Unknown" && (
            <span className="not-italic font-medium text-foreground/45 ml-1.5">— {todaysQuote.author}</span>
          )}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search reviews or customers..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md bg-background min-w-max">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>

            <Select value={platform} onValueChange={(v) => { setPlatform(v as any); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-background">
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
              <SelectTrigger className="w-[180px] bg-background truncate">
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
              <SelectTrigger className="w-[120px] bg-background">
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
              <SelectTrigger className="w-[140px] bg-background">
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto -mx-8 px-8 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading your reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card/50">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
            <p className="text-muted-foreground max-w-md">
              We couldn't find any reviews matching your current filters. Try adjusting your search or clearing filters.
            </p>
            {(platform !== "all" || locationId !== "all" || rating !== "all" || status !== "all" || search) && (
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setPlatform("all");
                  setLocationId("all");
                  setRating("all");
                  setStatus("all");
                  setSearch("");
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
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