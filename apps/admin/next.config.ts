import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker only, and set by the Dockerfile. It is not merely unnecessary
  // elsewhere: `next start` prints "does not work with output: standalone" and
  // is only accidentally fine today because .next still holds the ordinary
  // build beside the traced one.
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" as const } : {}),

  // Tracing walks up to find the workspace root, and left to itself it picks
  // whichever lockfile it meets first — on this machine a stray
  // C:\Users\xplic\pnpm-lock.yaml, four levels above the repo. Naming the root
  // keeps the traced file set correct wherever the build runs.
  outputFileTracingRoot: path.join(__dirname, "../.."),

  transpilePackages: ["@datarango/ui", "@datarango/api", "@datarango/auth"],
};

export default nextConfig;
