process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/ai-travel-planner-test';
process.env.MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'ai-travel-planner-test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret-minimum-32-characters';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-minimum-32-characters';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-groq-key';
process.env.GROQ_PRIMARY_MODEL =
  process.env.GROQ_PRIMARY_MODEL || 'llama-3.3-70b-versatile';
process.env.GROQ_FALLBACK_MODEL =
  process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';
process.env.LANGCHAIN_TRACING_V2 = process.env.LANGCHAIN_TRACING_V2 || 'false';
