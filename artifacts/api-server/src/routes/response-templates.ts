import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, responseTemplatesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// List all templates for the org
router.get("/response-templates", requireAuth, async (req, res): Promise<void> => {
  const templates = await db
    .select()
    .from(responseTemplatesTable)
    .where(eq(responseTemplatesTable.organizationId, req.session.organizationId!))
    .orderBy(responseTemplatesTable.createdAt);

  res.json(templates);
});

// Create a template
router.post("/response-templates", requireAuth, async (req, res): Promise<void> => {
  const { name, body } = req.body as { name?: string; body?: string };

  if (!name?.trim() || !body?.trim()) {
    res.status(400).json({ error: "name and body are required" });
    return;
  }

  const [template] = await db
    .insert(responseTemplatesTable)
    .values({
      organizationId: req.session.organizationId!,
      name: name.trim(),
      body: body.trim(),
    })
    .returning();

  res.status(201).json(template);
});

// Update a template
router.put("/response-templates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = req.params.id as string;
  const { name, body } = req.body as { name?: string; body?: string };

  if (!name?.trim() || !body?.trim()) {
    res.status(400).json({ error: "name and body are required" });
    return;
  }

  const [updated] = await db
    .update(responseTemplatesTable)
    .set({ name: name.trim(), body: body.trim() })
    .where(
      and(
        eq(responseTemplatesTable.id, id),
        eq(responseTemplatesTable.organizationId, req.session.organizationId!)
      )
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(updated);
});

// Delete a template
router.delete("/response-templates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = req.params.id as string;

  const [deleted] = await db
    .delete(responseTemplatesTable)
    .where(
      and(
        eq(responseTemplatesTable.id, id),
        eq(responseTemplatesTable.organizationId, req.session.organizationId!)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
