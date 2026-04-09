import { useState, useEffect } from "react";
import { X, SkipForward, CheckCheck, Loader2, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetReviewsQueryKey, getGetPriorityCountQueryKey } from "@workspace/api-client-react";

interface Template { id: string; name: string; body: string; }

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export default function BulkActionBar({ selectedIds, onClear }: BulkActionBarProps) {
  const [showRespondPanel, setShowRespondPanel] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState<"skip" | "respond" | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetch("/api/response-templates", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const count = selectedIds.length;

  const handleBulkSkip = async () => {
    setLoading("skip");
    try {
      const res = await fetch("/api/reviews/bulk-skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewIds: selectedIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast({ title: `${count} review${count > 1 ? "s" : ""} marked as skipped` });
      queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPriorityCountQueryKey() });
      onClear();
    } catch {
      toast({ variant: "destructive", title: "Failed to skip reviews" });
    } finally {
      setLoading(null);
    }
  };

  const handleBulkRespond = async () => {
    if (!responseText.trim()) {
      toast({ variant: "destructive", title: "Response text is required" });
      return;
    }
    setLoading("respond");
    try {
      const res = await fetch("/api/reviews/bulk-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewIds: selectedIds, responseText: responseText.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast({ title: `Response applied to ${count} review${count > 1 ? "s" : ""}` });
      queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPriorityCountQueryKey() });
      onClear();
      setResponseText("");
      setShowRespondPanel(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to apply responses" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
      <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Main bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
              {count}
            </span>
            <span className="text-sm font-medium text-foreground">
              {count === 1 ? "1 review selected" : `${count} reviews selected`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
              disabled={!!loading}
              onClick={handleBulkSkip}
            >
              {loading === "skip" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />}
              Skip all
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-8"
              disabled={!!loading}
              onClick={() => setShowRespondPanel((v) => !v)}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Apply response
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={onClear}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Respond panel */}
        {showRespondPanel && (
          <div className="border-t border-border px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">
                This response will be saved for all {count} selected reviews
              </p>
              {templates.length > 0 && (
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowTemplates((v) => !v)}
                  >
                    <FileText className="w-3 h-3" /> Templates <ChevronDown className="w-3 h-3" />
                  </Button>
                  {showTemplates && (
                    <div className="absolute right-0 bottom-full mb-1 w-64 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors border-b border-border last:border-0"
                          onClick={() => { setResponseText(t.body); setShowTemplates(false); }}
                        >
                          <p className="text-xs font-semibold text-foreground">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.body}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Textarea
              placeholder="Type a response to apply to all selected reviews..."
              className="text-sm resize-none h-24"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowRespondPanel(false); setShowTemplates(false); }}>
                Cancel
              </Button>
              <Button size="sm" disabled={!responseText.trim() || !!loading} onClick={handleBulkRespond}>
                {loading === "respond" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Apply to {count} review{count > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
