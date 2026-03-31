import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    // browserField must be false for Electron main process
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    rollupOptions: {
      external: [
        // Externalize ALL node modules for main process
        "electron",
        "electron-log",
        "electron-squirrel-startup",
        "dotenv",
        "@picovoice/porcupine-node",
        "@picovoice/pvrecorder-node",
        "node-key-sender",
        "uuid",
        "path",
        "fs",
        "child_process",
      ],
      output: {
        format: 'cjs',
      },
    },
  },
});
