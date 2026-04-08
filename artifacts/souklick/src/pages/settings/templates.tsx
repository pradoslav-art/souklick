import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  body: string;
}

export default function TemplatesSettings() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/response-templates", { credentials: "include" });
      if (res.ok) setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditBody(t.body);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async () => {
    if (!editName.trim() || !editBody.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/response-templates/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, body: editBody }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setTemplates(templates.map(t => t.id === editingId ? { ...t, name: editName, body: editBody } : t));
      setEditingId(null);
      toast({ title: "Template saved", className: "bg-green-50 border-green-200" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save template" });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/response-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setTemplates(templates.filter(t => t.id !== id));
      toast({ title: "Template deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete template" });
    }
  };

  const createTemplate = async () => {
    if (!newName.trim() || !newBody.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/response-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, body: newBody }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTemplates([...templates, created]);
      setNewName("");
      setNewBody("");
      setShowNew(false);
      toast({ title: "Template created", className: "bg-green-50 border-green-200" });
    } catch {
      toast({ variant: "destructive", title: "Failed to create template" });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Response Templates</h2>
        <p className="text-sm text-muted-foreground">
          Save reusable responses for common reviews. Use them in the review modal to skip AI generation entirely.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {templates.length === 0 && !showNew && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl text-center">
            <FileText className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No templates yet</p>
            <p className="text-xs text-muted-foreground">Create your first template to speed up responses.</p>
          </div>
        )}

        {templates.map(t => (
          <div key={t.id} className="border border-border rounded-xl p-4 bg-card shadow-sm">
            {editingId === t.id ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Template name"
                  className="font-medium"
                />
                <Textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  placeholder="Response text..."
                  className="min-h-[120px] resize-none text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={saving || !editName.trim() || !editBody.trim()}>
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm">{t.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{t.body}</p>
              </div>
            )}
          </div>
        ))}

        {showNew && (
          <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 shadow-sm space-y-3">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Template name (e.g. Thank you — 5 star)"
              className="font-medium bg-background"
              autoFocus
            />
            <Textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="Write the response text here..."
              className="min-h-[120px] resize-none text-sm bg-background"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowNew(false); setNewName(""); setNewBody(""); }} disabled={creating}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={createTemplate} disabled={creating || !newName.trim() || !newBody.trim()}>
                {creating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Create Template
              </Button>
            </div>
          </div>
        )}
      </div>

      {!showNew && (
        <Button variant="outline" onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      )}
    </div>
  );
}
