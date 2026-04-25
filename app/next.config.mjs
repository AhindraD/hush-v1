/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hush/sdk', '@hush/types'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};
export default nextConfig;
