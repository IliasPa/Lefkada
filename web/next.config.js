/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — remove these 3 lines if deploying to a Node.js host
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
