import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().min(1).default('ai-travel-planner'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  FRONTEND_URL: z.string().optional().default(''),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_PRIMARY_MODEL: z.string().min(1).default('llama3-70b-8192'),
  GROQ_FALLBACK_MODEL: z.string().min(1).default('llama3-8b-8192'),
  LANGSMITH_API_KEY: z.string().optional().default(''),
  LANGCHAIN_TRACING_V2: z.coerce.boolean().default(false),
  LANGSMITH_ENDPOINT: z.string().url().optional().default('https://api.smith.langchain.com'),
  LANGSMITH_PROJECT: z.string().optional().default(''),
  OPENWEATHER_API_KEY: z.string().optional().default(''),
  OPENWEATHER_BASE_URL: z.string().url().default('https://api.openweathermap.org'),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: NodeJS.ProcessEnv): Env => {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
};

const parsedEnv = parseEnv(process.env);

export const config = {
  env: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isTest: parsedEnv.NODE_ENV === 'test',
  database: {
    uri: parsedEnv.MONGO_URI,
    dbName: parsedEnv.MONGO_DB_NAME,
  },
  logger: {
    level: parsedEnv.LOG_LEVEL,
  },
  auth: {
    accessTokenSecret: parsedEnv.JWT_ACCESS_SECRET,
    refreshTokenSecret: parsedEnv.JWT_REFRESH_SECRET,
    accessTokenExpiresIn: parsedEnv.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresIn: parsedEnv.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    frontendUrl: parsedEnv.FRONTEND_URL,
  },
  integrations: {
    groqApiKey: parsedEnv.GROQ_API_KEY,
    groqPrimaryModel: parsedEnv.GROQ_PRIMARY_MODEL,
    groqFallbackModel: parsedEnv.GROQ_FALLBACK_MODEL,
    langSmithApiKey: parsedEnv.LANGSMITH_API_KEY,
    langChainTracing: parsedEnv.LANGCHAIN_TRACING_V2,
    openWeatherApiKey: parsedEnv.OPENWEATHER_API_KEY,
    openWeatherBaseUrl: parsedEnv.OPENWEATHER_BASE_URL,
  },
} as const;

export const env = {
  port: config.port,
  nodeEnv: config.env,
  frontendUrl: config.cors.frontendUrl,
  groqApiKey: config.integrations.groqApiKey,
  openWeatherApiKey: config.integrations.openWeatherApiKey,
};
