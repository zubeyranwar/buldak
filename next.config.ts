import { withPayload } from "@payloadcms/next/withPayload";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default withPayload(withPayload(nextConfig));
