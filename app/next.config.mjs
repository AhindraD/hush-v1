/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hush/sdk', '@hush/types'],

  // Next.js 16: serverExternalPackages for native/wasm modules
  serverExternalPackages: ['tweetnacl', 'bs58', '@umbra-privacy/sdk', '@umbra-privacy/web-zk-prover'],

  webpack: (config) => {
    // Suppress optional native module warnings from Solana/Anchor packages
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs:     false,
      net:    false,
      tls:    false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
