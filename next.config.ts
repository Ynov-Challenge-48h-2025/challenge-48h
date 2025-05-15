import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    WS_SERVER: process.env.WS_SERVER,
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;
