import { createApp } from "./app.js";

const app = await createApp();
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
