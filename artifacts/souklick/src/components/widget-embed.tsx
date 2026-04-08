import { useState } from "react";
import { Code2, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  locationId: string;
  initialToken: string | null | undefined;
}

export default function WidgetEmbed({ locationId, initialToken }: Props) {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(initialToken ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = window.location.origin.replace("5173", "3000"); // dev: frontend runs on 5173, API on 3000
  const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin;

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/widget-token`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { token: string };
      setToken(data.token);
    } catch {
      toast({ variant: "destructive", title: "Failed to generate widget token" });
    } finally {
      setLoading(false);
    }
  };

  const embedCode = token
    ? `<div data-souklick-widget="${token}"></div>\n<script src="${apiUrl}/widget.js"><\/script>`
    : null;

  const handleCopy = () => {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-10 pb-8">
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Public Review Widget</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Embed your best reviews on your website. Paste the snippet below into any HTML page — it shows your top 5 reviews automatically.
      </p>

      {!token ? (
        <Button onClick={generateToken} disabled={loading} variant="outline" className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
          Generate embed code
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/60">
            <span className="text-xs font-mono text-muted-foreground">HTML</span>
            <div className="flex items-center gap-2">
              <button
                onClick={generateToken}
                disabled={loading}
                title="Regenerate token"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        The widget shows your 4★ and 5★ reviews in a horizontal scrollable card row. It's lightweight, styled automatically, and works on any website.
      </p>
    </div>
  );
}
