/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    serverComponentsExternalPackages: ['chromadb', 'langchain']
  },
  // Configure webpack
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // Handle native dependencies
    config.externals = [...(config.externals || []), 'chromadb', 'langchain'];
    
    // Handle cheerio and other problematic packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
}

export default nextConfig; 