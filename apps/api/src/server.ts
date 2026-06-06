import { createApp } from "./app.js";
import { DEFAULT_API_PORT } from "./constants/apiConstants.js";

const port = Number(process.env.PORT ?? DEFAULT_API_PORT);
const app = createApp();

app.listen(port, () => {
  console.log(`Redaction API listening on http://localhost:${port}`);
});
