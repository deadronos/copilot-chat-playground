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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildFakeResponse = (prompt: string) => {
  return [
    "Copilot Chat Playground — simulated stream",
    "------------------------------------------",
    "Prompt received:",
    prompt.trim(),
    "",
    "This is a fake backend stream to validate the frontend UX.",
    "Chunks arrive roughly every 100ms.",
    "Milestone B will replace this with real Copilot output.",
    "",
  ].join("\n");
};

const chunkText = (text: string, size = 24) => {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
};

app.post("/api/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", issues: parsed.error.issues });
    return;
  }

  const { prompt } = parsed.data;
  const responseText = buildFakeResponse(prompt);
  const chunks = chunkText(responseText);

  let clientClosed = false;
  req.on("close", () => {
    clientClosed = true;
  });

  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Transfer-Encoding", "chunked");
  res.flushHeaders();

  try {
    for (const chunk of chunks) {
      if (clientClosed) {
        break;
      }
      res.write(chunk);
      await sleep(100);
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Streaming failed." });
      return;
    }
  }

  if (!clientClosed) {
    res.end();
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`);
});
