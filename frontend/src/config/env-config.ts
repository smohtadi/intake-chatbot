import * as z from 'zod';

// Empty values in .env (e.g. `VITE_APP_API_URL=`) are treated as unset, so the
// committed .env files can stay blank and still boot the app.
const withDefault = (fallback: string) =>
  z
    .string()
    .optional()
    .transform((s) => (s && s.trim() !== '' ? s : fallback));

const createEnv = () => {
  const EnvSchema = z.object({
    API_URL: withDefault(''),
    ENABLE_API_MOCKING: z
      .string()
      .optional()
      .refine((s) => !s || s === 'true' || s === 'false')
      .transform((s) => s === 'true'),
    APP_URL: withDefault('http://localhost:3000'),
    APP_MOCK_API_PORT: withDefault('8080'),
    AUTH_API_PATH: withDefault('/api/auth'),
  });

  const envVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith('VITE_APP_')) {
      acc[key.replace('VITE_APP_', '')] = value;
    }
    return acc;
  }, {});

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
The following variables are missing or invalid:
${Object.entries(z.flattenError(parsedEnv.error).fieldErrors)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}
`,
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();
