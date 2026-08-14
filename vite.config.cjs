const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

const buildId = process.env.VERCEL_GIT_COMMIT_SHA || `${process.env.npm_package_version || "local"}-${Date.now()}`;

module.exports = defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    host: "0.0.0.0",
    port: 5180,
    strictPort: true,
    open: "/#/login",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4180,
    strictPort: true,
    open: "/#/login",
    allowedHosts: true,
  },
});