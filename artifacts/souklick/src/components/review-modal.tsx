import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Bot, Save, Send, Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { 
  useGetReview, 
  useGenerateAiResponse,
  useCreateResponse,
  useUpdateResponse,
  useApproveResponse,
  getGetReviewsQueryKey,
  getGetPriorityCountQueryKey,
  getGetReviewQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlatformIcon } from "./review-card";

interface ReviewModalProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReviewModal({ reviewId, open, onOpenChange }: ReviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftText, setDraftText] = useState("");
  
  // Queries
  const { data: review, isLoading: isReviewLoading } = useGetReview(reviewId, {
    query: { enabled: open, queryKey: getGetReviewQueryKey(reviewId) }
  });

  // Mutations
  const generateDraft = useGenerateAiResponse();
  const createDraft = useCreateResponse();
  const updateDraft = useUpdateResponse();
  const approveResponse = useApproveResponse();

  const activeResponse = review?.responses?.[0];

  useEffect(() => {
    if (activeResponse) {
      setDraftText(activeResponse.finalText || activeResponse.draftText || "");
    } else {
      setDraftText("");
    }
  }, [activeResponse, open]);

  const handleGenerate = () => {
    generateDraft.mutate(
      { data: { reviewId } },
      {
        onSuccess: (data) => {
          setDraftText(data.draftText);
          toast({ title: "AI Draft Generated", description: "Review and edit the draft before saving." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to generate AI response." });
        }
      }
    );
  };

  const handleSaveDraft = () => {
    if (!draftText.trim()) return;

    if (activeResponse) {
      updateDraft.mutate(
        { id: activeResponse.id, data: { draftText, status: "draft" } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetReviewQueryKey(reviewId) });
            queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
            toast({ title: "Draft Saved" });
          }
        }
      );
    } else {
      createDraft.mutate(
        { data: { reviewId, draftText } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetReviewQueryKey(reviewId) });
            queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
            toast({ title: "Draft Created" });
          }
        }
      );
    }
  };

  const handleApprove = () => {
    if (!draftText.trim()) return;
    
    // If no active response, we need to create it first, then approve it
    // In a real app we might combine these or have a simpler flow
    const responseId = activeResponse?.id;
    
    if (!responseId) {
      createDraft.mutate(
        { data: { reviewId, draftText } },
        {
          onSuccess: (newResponse) => {
            executeApprove(newResponse.id, draftText);
          }
        }
      );
    } else {
      executeApprove(responseId, draftText);
    }
  };

  const executeApprove = (id: string, text: string) => {
    approveResponse.mutate(
      { id, data: { finalText: text } },
      {
        onSuccess: () => {
          toast({ 
            title: "Response Published", 
            description: "Successfully posted to the platform.",
            className: "bg-green-50 border-green-200"
          });
          queryClient.invalidateQueries({ queryKey: getGetReviewQueryKey(reviewId) });
          queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPriorityCountQueryKey() });
          setTimeout(() => onOpenChange(false), 1500);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Publishing Failed", description: "Could not post to the platform." });
        }
      }
    );
  };

  if (!review) return null;

  const isResponded = review.responseStatus === "responded";
  const isWorking = generateDraft.isPending || createDraft.isPending || updateDraft.isPending || approveResponse.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 border-border">
        <div className="bg-muted/40 p-6 border-b border-border flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border bg-background shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {review.reviewerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-foreground leading-none">{review.reviewerName}</h2>
                <Badge variant="outline" className="bg-background shadow-sm flex items-center gap-1.5 h-6">
                  <PlatformIcon platform={review.platform} className="w-3 h-3" />
                  <span className="capitalize text-xs font-semibold">{review.platform}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                on {format(new Date(review.reviewDate), "MMMM d, yyyy")} • {review.locationName}
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < review.rating ? "text-amber-400" : "text-muted"}`}>★</span>
                ))}
                {review.rating <= 3 && (
                  <Badge variant="destructive" className="ml-2 h-5 text-[10px] font-bold">Priority</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Customer Review</h3>
            <div className="bg-card border border-border p-4 rounded-xl text-foreground text-[15px] leading-relaxed shadow-sm">
              {review.reviewText || <span className="italic text-muted-foreground">Rating only, no text provided.</span>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Response</h3>
              {!isResponded && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5 text-primary border-primary/20 hover:bg-primary/5"
                  onClick={handleGenerate}
                  disabled={isWorking}
                >
                  {generateDraft.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : draftText ? (
                    <RefreshCw className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                  {draftText ? "Regenerate AI Draft" : "Generate AI Draft"}
                </Button>
              )}
            </div>

            <Textarea
              className="min-h-[160px] text-[15px] leading-relaxed resize-none bg-background focus-visible:ring-primary/20"
              placeholder="Draft your response here..."
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={isResponded || isWorking}
            />

            {isResponded && activeResponse?.status === "posted" && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5" />
                This response has been successfully published to {review.platform}.
              </div>
            )}
            
            {activeResponse?.status === "failed" && (
              <div className="flex items-center gap-2 text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="w-5 h-5" />
                Failed to publish. Please check your integration settings and try again.
              </div>
            )}
          </div>
        </div>

        {!isResponded && (
          <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isWorking}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={!draftText.trim() || isWorking}
                className="gap-2"
              >
                {createDraft.isPending || updateDraft.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={!draftText.trim() || isWorking}
                className="gap-2 font-semibold shadow-md"
              >
                {approveResponse.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Approve & Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}