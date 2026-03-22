/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  webpack(config, { dev }) {
    // #region agent log
    if (dev) {
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.done.tap('AgentDebugWebpackDone', (stats) => {
            const name =
              stats.compilation?.name ||
              compiler.options?.name ||
              'unknown';
            fetch(
              'http://127.0.0.1:7242/ingest/5b21ff9a-408f-493c-b269-17392d0670a5',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Debug-Session-Id': '6295dc',
                },
                body: JSON.stringify({
                  sessionId: '6295dc',
                  location: 'next.config.mjs:webpack.done',
                  message: 'webpack compilation finished',
                  data: {
                    compilationName: name,
                    hash: stats.hash,
                    hasErrors: stats.hasErrors(),
                  },
                  timestamp: Date.now(),
                  hypothesisId: 'H1',
                }),
              }
            ).catch(() => {});
          });
        },
      });
    }
    // #endregion
    return config;
  },
};

export default nextConfig;
