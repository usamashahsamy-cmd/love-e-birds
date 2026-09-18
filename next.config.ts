import type { NextConfig } from "next";

const remotePatterns: { protocol: "http" | "https"; hostname: string }[] = [
  { protocol: "https", hostname: "i.pravatar.cc" },
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "placehold.co" },
];

function addRemotePattern(urlString: string | undefined) {
  if (!urlString) return;
  try {
    const url = new URL(urlString);
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
    });
  } catch {
    // ignore invalid URL
  }
}

addRemotePattern(process.env.R2_PUBLIC_URL);
addRemotePattern(process.env.R2_ENDPOINT);

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/uploads/**" }],
    remotePatterns,
  },
};

export default nextConfig;