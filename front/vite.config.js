import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as process from 'process';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: Number(process.env.PORT) || 4000,
  },
});
