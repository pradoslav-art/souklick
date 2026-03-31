import { useMemo } from "react";
import { Link } from "wouter";
import { 
  useGetReviews, 
  getGetReviewsQueryKey,
} from "@workspace/api-client-react";
import { Loader2, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ReviewCard from "@/components/review-card";

export default function Priority() {
  const queryParams = useMemo(() => ({ 
    priorityOnly: true,
    status: "pending" as const,
    limit: 50
  }), []);

  const { data: reviewData, isLoading } = useGetReviews(queryParams, { 
    query: { queryKey: getGetReviewsQueryKey(queryParams) } 
  });

  const reviews = reviewData?.reviews || [];

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Priority Queue</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Urgent: Unresponded 1-3 star reviews that need your attention.
          </p>
        </div>
        <div className="bg-card border shadow-sm px-6 py-4 rounded-xl flex flex-col items-end">
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Waiting</span>
          <div className="text-3xl font-bold text-destructive">
            {isLoading ? "-" : reviews.length}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading priority reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-card rounded-2xl border shadow-sm p-12">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">All caught up!</h3>
            <p className="text-muted-foreground text-lg max-w-md mb-8">
              There are no negative reviews waiting for a response. Great job protecting the brand!
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2">
                Return to Inbox <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="relative">
                {/* Priority Indicator Line */}
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-destructive rounded-full"></div>
                <ReviewCard review={review} isPriority={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}