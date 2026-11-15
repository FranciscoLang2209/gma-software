import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conservar AGENTS.md sin modificaciones automáticas al iniciar desarrollo.
  agentRules: false,
};

export default nextConfig;
