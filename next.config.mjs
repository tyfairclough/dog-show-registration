/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@heroui/react", "@heroui/system", "@heroui/theme"],
  experimental: {
    serverComponentsExternalPackages: ["puppeteer"],
  },
};

export default nextConfig;
