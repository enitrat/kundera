import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kunderaRoot = path.resolve(__dirname, "..", "kundera-ts");

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@kundera-sn\/kundera-ts$/,
        replacement: path.resolve(kunderaRoot, "src/index.ts")
      },
      {
        find: /^@kundera-sn\/kundera-ts\/(.*)$/,
        replacement: path.resolve(kunderaRoot, "src/$1/index.ts")
      }
    ]
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["**/node_modules/**"],
    environment: "node"
  }
});
