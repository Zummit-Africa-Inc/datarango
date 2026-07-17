import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@datarango/ui", "@datarango/api", "@datarango/auth"],
};

export default nextConfig;
