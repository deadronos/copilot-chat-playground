import cors from "cors";
import express from "express";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
});

app.post("/api/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  // TODO: Milestone A/B: stream fake output or proxy to copilot service.
  res.status(501).json({ error: "Not implemented yet. TODO: stream response." });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`);
});
