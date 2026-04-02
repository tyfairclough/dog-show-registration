import { config } from 'dotenv';
import { defineConfig, env } from '@prisma/config';

// Match Next.js-style precedence so Prisma CLI picks up local DB without a committed `.env`.
config();
config({ path: '.env.local', override: true });

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});