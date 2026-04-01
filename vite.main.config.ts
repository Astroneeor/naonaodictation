import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    rollupOptions: {
      external: [
        // Electron runtime - provided by the Electron binary
        "electron",
        // Native addons (.node binaries) - cannot be bundled
        "@picovoice/porcupine-node",
        "@picovoice/pvrecorder-node",
        "node-key-sender",
        // Node.js built-ins - provided at runtime
        "path",
        "fs",
        "child_process",
        "os",
        "crypto",
        "events",
        "stream",
        "util",
        "assert",
        "url",
        "buffer",
      ],
      output: {
        format: 'cjs',
      },
    },
  },
});
