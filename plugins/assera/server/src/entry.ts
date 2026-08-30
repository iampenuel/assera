import { runHttp, runStdio } from "./server.ts";

if (process.argv.includes("--http")) {
  runHttp();
} else {
  await runStdio();
}
