/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://revelbaby-ee615.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
