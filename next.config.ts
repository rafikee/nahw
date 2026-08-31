import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

// The settings sheet shows this so a build can be identified from a phone. Read
// it from package.json rather than typing it into the component: the hardcoded
// copy sat at v0.3.0 through six releases, which made the one visible check on
// "what is actually live" say the wrong thing every time.
const { version } = JSON.parse(readFileSync("./package.json", "utf8"));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.86.80", "192.168.86.241", "192.168.68.82", "192.168.68.77"],
  output: "standalone",
  env: { NEXT_PUBLIC_APP_VERSION: version },
};

export default nextConfig;
