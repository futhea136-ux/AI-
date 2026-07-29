import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

if (!existsSync("out")) {
  throw new Error("Next.js static export directory 'out' was not generated.");
}

if (existsSync("dist")) {
  await rm("dist", { recursive: true, force: true });
}

await cp("out", "dist", { recursive: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("sites/server/index.js", "dist/server/index.js");
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
