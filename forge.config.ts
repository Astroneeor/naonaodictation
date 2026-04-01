import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import path from "path";
import fs from "fs";

// Recursively copy a directory
function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    name: "NaoNao",
    executableName: "naonao",
    icon: "./src/assets/icon",
    extraResource: [
      "./scripts",
      "./.env",
      "./src/assets",
    ],
  },
  rebuildConfig: {
    onlyModules: [],
  },
  hooks: {
    postPackage: async (_forgeConfig, options) => {
      // After packaging, copy native modules into app/node_modules
      // so require() can find them from .vite/build/main.js
      const outputPath = options.outputPaths[0];
      const appNodeModules = path.join(outputPath, "resources", "app", "node_modules");

      const nativeModules = [
        path.join("@picovoice", "porcupine-node"),
        path.join("@picovoice", "pvrecorder-node"),
        "node-key-sender",
      ];

      for (const mod of nativeModules) {
        const src = path.join(process.cwd(), "node_modules", mod);
        const dest = path.join(appNodeModules, mod);
        if (fs.existsSync(src)) {
          console.log(`Copying native module: ${mod}`);
          copyDir(src, dest);
        } else {
          console.warn(`Native module not found: ${src}`);
        }
      }
    },
  },
  makers: [
    new MakerSquirrel({
      name: "NaoNao",
      setupIcon: "./src/assets/icon.ico",
    }),
    new MakerZIP({}, ["darwin", "linux"]),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/main/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
