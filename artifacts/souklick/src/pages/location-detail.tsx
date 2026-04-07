import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Star, MessageSquare } from "lucide-react";
import {
  useGetLocation,
  getGetLocationQueryKey,
  useGetReviews,
  getGetReviewsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReviewCard from "@/components/review-card";

interface LocationDetailProps {
  locationId: string;
}

export default function LocationDetail({ locationId }: LocationDetailProps) {
  const { data: location, isLoading: loadingLocation } = useGetLocation(locationId, {
    query: { queryKey: getGetLocationQueryKey(locationId) },
  });

  const queryParams = useMemo(() => ({ locationId, limit: 50 }), [locationId]);
  const { data: reviewData, isLoading: loadingReviews } = useGetReviews(queryParams, {
    query: { queryKey: getGetReviewsQueryKey(queryParams) },
  });

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
            <Badge
              variant={location.isActive ? "default" : "secondary"}
              className={location.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-none" : ""}
            >
              {location.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-5 p-4 bg-card border rounded-xl">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{location.averageRating?.toFixed(1) ?? "—"}</span>
              <span className="text-sm text-muted-foreground">avg rating</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div>
              <span className="font-bold">{location.reviewCount}</span>
              <span className="text-sm text-muted-foreground ml-1.5">reviews</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div>
              <span className={`font-bold ${location.responseRate > 80 ? "text-green-600" : location.responseRate < 50 ? "text-destructive" : ""}`}>
                {location.responseRate}%
              </span>
              <span className="text-sm text-muted-foreground ml-1.5">response rate</span>
            </div>
            {(location.googlePlaceId || location.zomatoRestaurantId || (location as any).tripadvisorLocationId) && (
              <>
                <div className="w-px h-5 bg-border" />
                <div className="flex gap-2">
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
        <h2 className="text-lg font-semibold mb-4">Reviews</h2>
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
            <p className="font-medium mb-1">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Reviews for this location will appear here once they come in.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
