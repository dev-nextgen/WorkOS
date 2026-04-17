import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 8081,
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
});
