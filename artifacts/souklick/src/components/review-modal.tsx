import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Bot, Save, Check, Loader2, RefreshCw, AlertCircle, CheckCircle, Copy, FileText, ChevronDown, Tag } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";

interface ReviewModalProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAG_COLOURS: Record<string, string> = {
  food:        "bg-orange-100 text-orange-800 border-orange-200",
  service:     "bg-blue-100 text-blue-800 border-blue-200",
  "wait time": "bg-yellow-100 text-yellow-800 border-yellow-200",
  ambiance:    "bg-purple-100 text-purple-800 border-purple-200",
  value:       "bg-green-100 text-green-800 border-green-200",
  cleanliness: "bg-cyan-100 text-cyan-800 border-cyan-200",
  staff:       "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivery:    "bg-pink-100 text-pink-800 border-pink-200",
};

function PlatformIcon({ platform, className = "w-4 h-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case "google":
      return <SiGoogle className={`text-[#4285F4] ${className}`} />;
    case "zomato":
      return <SiZomato className={`text-[#E23744] ${className}`} />;
    case "tripadvisor":
      return <SiTripadvisor className={`text-[#00AF87] ${className}`} />;
    default:
      return <Check className={className} />;
  }
}

export default function ReviewModal({ reviewId, open, onOpenChange }: ReviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftText, setDraftText] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; body: string }[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [tagging, setTagging] = useState(false);
  
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
    setUserNotes("");
    setCopied(false);
  }, [activeResponse, open]);

  const handleAutoTag = async () => {
    setTagging(true);
    try {
      await fetch("/api/ai/tag-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: getGetReviewQueryKey(reviewId) });
    } finally {
      setTagging(false);
    }
  };

  const loadTemplates = async () => {
    if (templatesLoaded) return;
    try {
      const res = await fetch("/api/response-templates", { credentials: "include" });
      if (res.ok) setTemplates(await res.json());
    } finally {
      setTemplatesLoaded(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGenerate = () => {
    generateDraft.mutate(
      { data: { reviewId, userNotes: userNotes.trim() || undefined } },
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
            title: "Response Approved",
            description: "Marked as responded. Copy the text and post it on the platform.",
            className: "bg-green-50 border-green-200"
          });
          queryClient.invalidateQueries({ queryKey: getGetReviewQueryKey(reviewId) });
          queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPriorityCountQueryKey() });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to approve", description: "Something went wrong. Please try again." });
        }
      }
    );
  };

  if (isReviewLoading || !review) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden gap-0 border-border mx-3 sm:mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isResponded = review.responseStatus === "responded";
  const isWorking = generateDraft.isPending || createDraft.isPending || updateDraft.isPending || approveResponse.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden gap-0 border-border mx-3 sm:mx-auto max-h-[calc(100dvh-1.5rem)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Review response editor</DialogTitle>
          <DialogDescription>Review the customer feedback and draft or approve a response.</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 p-4 sm:p-6 border-b border-border flex items-start justify-between">
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

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100dvh-11rem)]">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Customer Review</h3>
            <div className="bg-card border border-border p-4 rounded-xl text-foreground text-[15px] leading-relaxed shadow-sm">
              {review.reviewText || <span className="italic text-muted-foreground">Rating only, no text provided.</span>}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              {(review.tags ?? []).map((tag: string) => {
                const colours = TAG_COLOURS[tag] ?? "bg-muted text-muted-foreground border-border";
                return (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colours}`}>
                    {tag}
                  </span>
                );
              })}
              {review.reviewText && (review.tags ?? []).length === 0 && (
                <button
                  onClick={handleAutoTag}
                  disabled={tagging}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {tagging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
                  {tagging ? "Tagging…" : "Auto-tag topics"}
                </button>
              )}
            </div>
          </div>

          {!isResponded && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes for AI <span className="normal-case font-normal text-muted-foreground/70">(optional)</span></h3>
              <Textarea
                className="min-h-[60px] text-sm resize-none bg-background focus-visible:ring-primary/20"
                placeholder="e.g. mention we fixed the issue, offer a free dessert on next visit…"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                disabled={isWorking}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Response</h3>
              <div className="flex flex-wrap items-center gap-2">
                {draftText && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                )}
                {!isResponded && (
                  <>
                    <DropdownMenu onOpenChange={(open) => { if (open) loadTemplates(); }}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          disabled={isWorking}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Use Template
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {!templatesLoaded ? (
                          <DropdownMenuItem disabled>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Loading...
                          </DropdownMenuItem>
                        ) : templates.length === 0 ? (
                          <DropdownMenuItem disabled>No templates saved yet</DropdownMenuItem>
                        ) : (
                          templates.map(t => (
                            <DropdownMenuItem key={t.id} onSelect={() => setDraftText(t.body)}>
                              {t.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  </>
                )}
              </div>
            </div>

            <Textarea
              className="min-h-[160px] text-[15px] leading-relaxed resize-none bg-background focus-visible:ring-primary/20"
              placeholder="Draft your response here..."
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={isResponded || isWorking}
            />

            {isResponded && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Response approved. Copy the text above and post it on {review.platform}.
              </div>
            )}

            {activeResponse?.status === "failed" && (
              <div className="flex items-center gap-2 text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="w-5 h-5" />
                Something went wrong. Please try again.
              </div>
            )}
          </div>
        </div>

        {!isResponded && (
          <div className="bg-muted/40 p-4 border-t border-border flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isWorking} className="w-full sm:w-auto">
              Cancel
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={!draftText.trim() || isWorking}
                className="gap-2 w-full sm:w-auto"
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
                className="gap-2 font-semibold shadow-md w-full sm:w-auto"
              >
                {approveResponse.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approve Response
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