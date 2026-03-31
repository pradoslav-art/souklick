import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";
import { Star, Clock, FileText, CheckCircle, ExternalLink, Bot, PenLine, AlertCircle } from "lucide-react";
import { 
  Review, 
  ReviewPlatform, 
  useUpdateReviewStatus,
  getGetReviewsQueryKey,
  getGetPriorityCountQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import ReviewModal from "./review-modal";

interface ReviewCardProps {
  review: Review;
  isPriority?: boolean;
}

export const PlatformIcon = ({ platform, className = "w-4 h-4" }: { platform: ReviewPlatform, className?: string }) => {
  switch (platform) {
    case "google": return <SiGoogle className={`text-[#4285F4] ${className}`} />;
    case "zomato": return <SiZomato className={`text-[#E23744] ${className}`} />;
    case "tripadvisor": return <SiTripadvisor className={`text-[#00AF87] ${className}`} />;
    default: return <Star className={className} />;
  }
};

export default function ReviewCard({ review, isPriority = false }: ReviewCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateReviewStatus();

  const daysWaiting = differenceInDays(new Date(), new Date(review.reviewDate));
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate(
      { id: review.id, data: { responseStatus: "skipped" } },
      {
        onSuccess: () => {
          toast({ title: "Review marked as read/skipped" });
          queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPriorityCountQueryKey() });
        }
      }
    );
  };

  const getStatusBadge = () => {
    switch (review.responseStatus) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold shadow-none">Pending</Badge>;
      case "draft_saved":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 font-semibold shadow-none">Draft Saved</Badge>;
      case "responded":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 font-semibold shadow-none"><CheckCircle className="w-3 h-3 mr-1" /> Responded</Badge>;
      case "skipped":
        return <Badge variant="outline" className="text-muted-foreground shadow-none">Skipped</Badge>;
    }
  };

  const truncateText = (text: string | null | undefined, length: number) => {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const needsAttention = review.responseStatus === "pending" || review.responseStatus === "draft_saved";

  return (
    <>
      <Card 
        className={`overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer border ${isPriority ? 'border-destructive/40 shadow-sm' : 'border-border'}`}
        onClick={() => setModalOpen(true)}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            
            {/* Left sidebar - Meta */}
            <div className={`md:w-[220px] p-5 border-b md:border-b-0 md:border-r border-border ${needsAttention ? 'bg-card' : 'bg-muted/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 bg-background border px-2.5 py-1 rounded-md shadow-sm">
                  <PlatformIcon platform={review.platform} />
                  <span className="text-xs font-semibold capitalize">{review.platform}</span>
                </div>
                {isPriority && daysWaiting > 0 && (
                  <Badge variant="destructive" className="animate-pulse shadow-sm">
                    {daysWaiting}d wait
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {review.reviewerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm leading-tight text-foreground truncate max-w-[130px]" title={review.reviewerName}>
                    {review.reviewerName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {format(new Date(review.reviewDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Location</p>
                <p className="text-sm font-semibold truncate text-foreground bg-secondary/50 px-2 py-1.5 rounded-md border border-border/50" title={review.locationName}>
                  {review.locationName}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} 
                    />
                  ))}
                </div>
                {getStatusBadge()}
              </div>
            </div>

            {/* Right side - Content */}
            <div className={`flex-1 p-5 flex flex-col justify-between ${!needsAttention ? 'opacity-80' : ''}`}>
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-foreground">
                    {review.rating >= 4 ? "Positive Feedback" : review.rating === 3 ? "Mixed Feedback" : "Negative Feedback"}
                  </h3>
                  {review.sentimentScore !== null && review.sentimentScore !== undefined && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={`text-xs px-2 py-1 rounded font-medium border ${
                          review.sentimentScore > 0.3 ? "bg-green-50 text-green-700 border-green-200" :
                          review.sentimentScore < -0.3 ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }`}>
                          Score: {review.sentimentScore.toFixed(2)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>AI Sentiment Analysis Score (-1 to 1)</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="text-foreground/90 leading-relaxed mb-6 whitespace-pre-wrap">
                  {review.reviewText ? (
                    expanded ? review.reviewText : truncateText(review.reviewText, 250)
                  ) : (
                    <span className="italic text-muted-foreground">No written review provided.</span>
                  )}
                  {review.reviewText && review.reviewText.length > 250 && !expanded && (
                    <span 
                      className="text-primary font-medium ml-1 hover:underline cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                    >
                      Read more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {review.responseStatus === "responded" ? (
                    <span className="flex items-center text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Response Published
                    </span>
                  ) : review.responseStatus === "draft_saved" ? (
                    <span className="flex items-center text-blue-600 font-medium">
                      <FileText className="w-4 h-4 mr-1.5" /> Draft Ready for Approval
                    </span>
                  ) : review.responseStatus === "pending" ? (
                    <span className="flex items-center text-amber-600 font-medium">
                      <AlertCircle className="w-4 h-4 mr-1.5" /> Action Required
                    </span>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  {review.responseStatus === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleMarkAsRead} className="hover:bg-muted">
                        Mark Read
                      </Button>
                      <Button size="sm" className="gap-1.5 shadow-sm">
                        <Bot className="w-4 h-4" /> Draft Response
                      </Button>
                    </>
                  )}
                  {review.responseStatus === "draft_saved" && (
                    <Button size="sm" className="gap-1.5 shadow-sm">
                      <PenLine className="w-4 h-4" /> Review Draft
                    </Button>
                  )}
                  {review.responseStatus === "responded" && (
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ExternalLink className="w-4 h-4" /> View Response
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReviewModal 
        reviewId={review.id} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}