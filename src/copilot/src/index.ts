import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "copilot" });
});

const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(20_000),
});

app.post("/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  // TODO: Milestone B/C: spawn copilot-cli or use @github/copilot-sdk.
  res.status(501).json({ error: "Not implemented yet. TODO: call Copilot." });
});

const port = Number(process.env.PORT ?? 3210);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[copilot] listening on http://localhost:${port}`);
});
