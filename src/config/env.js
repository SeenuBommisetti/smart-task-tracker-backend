const dotenv = require('dotenv');
const { parseOrigins } = require('./corsOptions');

dotenv.config();

const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: process.env.DB_SSL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10,
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN || 'http://localhost:5173')
};
