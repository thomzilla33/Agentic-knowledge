import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      // Stub values so config.ts passes Zod validation in test env
      TWILIO_ACCOUNT_SID: 'AC-test',
      TWILIO_AUTH_TOKEN: 'test-token',
      TWILIO_WEBHOOK_BASE_URL: 'https://example.com',
      DEEPGRAM_API_KEY: 'test-dg-key',
      OPENAI_API_KEY: 'sk-test',
      AWS_S3_BUCKET: 'test-bucket',
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      AIMS_AGENT_ENGINE_URL: 'http://localhost:4001',
      AIMS_AGENT_ENGINE_API_KEY: 'test-engine-key',
    },
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/server.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
})
