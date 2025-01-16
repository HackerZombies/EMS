import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  pwa: {
    dest: "public", // Directory for service worker files
    register: true, // Auto-register the service worker
    skipWaiting: true, // Activate the new service worker immediately
    disable: process.env.NODE_ENV === 'development', // Disable PWA during development mode
  },
});

// Add the experimental flag separately
export default {
  ...nextConfig,
  experimental: {
    swcPlugins: [["next-superjson-plugin", {}]], // Existing plugin support
  },
};
