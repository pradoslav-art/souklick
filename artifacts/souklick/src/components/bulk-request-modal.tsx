import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  name: string;
  email: string;
  phone: string;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  location: any;
}

function parseCSV(text: string): Contact[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect if first row is a header
  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes("name") || firstLower.includes("email") || firstLower.includes("phone");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[0] ?? "";
    const email = cols[1] ?? "";
    const phone = cols[2] ?? "";
    let error: string | undefined;
    if (!name) error = "Name missing";
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "Invalid email";
    return { name, email, phone, error };
  }).filter((c) => c.name || c.email);
}

export default function BulkRequestModal({ open, onOpenChange, locationId, location }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [platform, setPlatform] = useState("");
  const [sendVia, setSendVia] = useState<"email" | "sms" | "both">("email");
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);

  const validContacts = contacts.filter((c) => {
    if (c.error) return false;
    if ((sendVia === "email" || sendVia === "both") && !c.email) return false;
    if ((sendVia === "sms" || sendVia === "both") && !c.phone) return false;
    return true;
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContacts(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setContacts([]);
    setPlatform("");
    setSendVia("email");
  };

  const handleSend = async () => {
    if (!platform) { toast({ variant: "destructive", title: "Select a platform" }); return; }
    if (validContacts.length === 0) { toast({ variant: "destructive", title: "No valid contacts to send to" }); return; }

    setSending(true);
    try {
      const res = await fetch("/api/review-requests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          locationId,
          platform,
          sendVia,
          contacts: validContacts.map((c) => ({ name: c.name, email: c.email || undefined, phone: c.phone || undefined })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      localStorage.setItem("souklick_review_request_sent", "true");
      toast({ title: `${data.sent} requests sent!`, className: "bg-green-50 border-green-200" });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send", description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk review requests</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Upload a CSV with customer names, emails, and/or phone numbers. We'll send each one a review request.
        </p>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* CSV format hint */}
          <div className="bg-muted/50 rounded-lg px-4 py-2.5 text-xs text-muted-foreground font-mono">
            name, email, phone (phone optional)<br />
            Sarah Jones, sarah@example.com, +447700900000<br />
            Mike Smith, mike@example.com
          </div>

          {/* Drop zone */}
          {contacts.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drop your CSV here or click to browse</p>
              <p className="text-xs text-muted-foreground">Accepts .csv files up to 500 rows</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {/* Preview table */}
          {contacts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{contacts.length} rows parsed — {validContacts.length} valid</p>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={reset}>
                  <X className="w-3 h-3" /> Clear
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">Email</th>
                      <th className="text-left px-3 py-2 font-medium">Phone</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contacts.map((c, i) => (
                      <tr key={i} className={c.error ? "bg-red-50" : ""}>
                        <td className="px-3 py-2">{c.name || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.email || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="px-2 py-2">
                          {c.error
                            ? <span title={c.error}><AlertCircle className="w-3.5 h-3.5 text-red-400" /></span>
                            : <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Platform + Send Via */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Platform</p>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {location?.googlePlaceId && <SelectItem value="google">Google</SelectItem>}
                  {location?.zomatoRestaurantId && <SelectItem value="zomato">Zomato</SelectItem>}
                  {location?.tripadvisorLocationId && <SelectItem value="tripadvisor">TripAdvisor</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Send via</p>
              <div className="flex rounded-lg border border-border overflow-hidden h-10">
                {(["email", "sms", "both"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSendVia(opt)}
                    className={`flex-1 text-xs font-medium transition-colors ${sendVia === opt ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    {opt === "both" ? "Both" : opt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t mt-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || validContacts.length === 0 || !platform} className="gap-2">
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Users className="w-4 h-4" />
            }
            Send to {validContacts.length} customer{validContacts.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
