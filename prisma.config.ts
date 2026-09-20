import { defineConfig } from '@prisma/internals'

export default defineConfig({
  orm: {
    schemaPath: './prisma/schema.prisma',
  },
})
