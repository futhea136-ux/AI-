import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/AI-" : "",
  assetPrefix: isGitHubPages ? "/AI-/" : undefined
};

export default nextConfig;
