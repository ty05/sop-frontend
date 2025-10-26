/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    // WARNING: ビルド時のESLintチェックを無効化
    ignoreDuringBuilds: true,
  },

  eslint: {
    // WARNING: ビルド時のESLintチェックを無効化
    ignoreDuringBuilds: true,
  },
 

  // PWA headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};



module.exports = nextConfig;
