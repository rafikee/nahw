import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["192.168.86.80", "192.168.86.241"],
};

export default nextConfig;
