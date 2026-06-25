const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5180,
    strictPort: true,
    open: "/#/login",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4180,
    strictPort: true,
    open: "/#/login",
  },
});
