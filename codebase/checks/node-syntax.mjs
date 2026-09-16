import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { walkFiles } from "../utilities/fs.mjs";

const execFileAsync = promisify(execFile);
const files = (await walkFiles(fileURLToPath(new URL("..", import.meta.url))))
  .filter((file) => file.endsWith(".mjs"));

for (const file of files) await execFileAsync(process.execPath, ["--check", file]);
process.stdout.write(`Checked ${files.length} module files.\n`);
