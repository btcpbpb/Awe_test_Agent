import { defineConfig } from "vitest/config";
import path from "path";

const projectName = process.env.PROJECT || "testerhome";
const projectRoot = path.resolve(__dirname, "projects", projectName);

export default defineConfig({
  test: {
    include: [`projects/${projectName}/tests/**/*.test.ts`],
    globalSetup: ["core/setup/globalSetup.ts"],
    sequence: { concurrent: false },
    retry: 0,
    testTimeout: 600_000,
    hookTimeout: 300_000,
    reporters: [
      "verbose",
      ["allure-vitest/reporter", { resultsDir: "./allure-results" }],
    ],
    setupFiles: [
      "allure-vitest/setup",
      "core/setup/env.ts",
      `projects/${projectName}/setup.ts`,
    ],
    tags: [
      { name: "smoke" },
      { name: "regression" },
      { name: "p0" },
      { name: "p1" },
      { name: "p2" },
      { name: "auth" },
      { name: "topics" },
      { name: "search" },
      { name: "user" },
      { name: "community" },
    ],
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "core"),
      "@project": projectRoot,
    },
  },
});
