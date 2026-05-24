import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: ["res.cloudinary.com"],
  },
  allowedDevOrigins: ['10.127.155.122'],
};

export default withPayload(withPayload(nextConfig));
