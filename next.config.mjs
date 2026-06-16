/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  poweredByHeader: false,
  // Disable Next.js font optimization — we load fonts via <link> at runtime
  optimizeFonts: false,
};

export default nextConfig;
