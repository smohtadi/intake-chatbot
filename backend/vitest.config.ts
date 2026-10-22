import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    env: {
      NODE_ENV: "test",
      DEMO_USERNAME: "demo",
      // scrypt hash of "test-password"
      DEMO_PASSWORD_HASH:
        "scrypt$85532783a8b8312310c01d38afc7a049$08f284bdd8dfbacaa0f526fcbb9b0fb2b72143fa7d6ba4b7afb6617619a7e2047b60dd7a966a10d002b2542749d0610ec592c30e1d9886882870202b02383858",
      ANTHROPIC_API_KEY: "test-key-never-used",
      STATIC_DIR: "",
    },
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/llm/anthropic-client.ts", "src/**/__tests__/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
