/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your existing experimental plugin settings
  experimental: {
    swcPlugins: [["next-superjson-plugin", {}]],
  },

  // Allow loading images from Cloudinary
  images: {
    // For Next.js 13+:
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
    
    // If you're on an older version of Next.js that doesn't support remotePatterns,
    // you can use: domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
