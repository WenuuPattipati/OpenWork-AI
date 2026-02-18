import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  output: 'standalone', // Required for Docker deployment
  // turbopack: {
  //   root: path.resolve(__dirname),
  // },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'openi.nlm.nih.gov',
      },
      {
        protocol: 'https',
        hostname: 'visualsonline.cancer.gov',
      },
      {
        protocol: 'https',
        hostname: 'injurymap.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'google.serper.dev',
      },
    ],
  },
};

export default nextConfig;
