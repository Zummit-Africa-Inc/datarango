import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@datarango/ui", "@datarango/api", "@datarango/auth", "@datarango/realtime"],
};

export default nextConfig;
