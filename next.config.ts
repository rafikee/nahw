import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.86.80", "192.168.86.241", "192.168.68.82"],
  output: "standalone",
};

export default nextConfig;
