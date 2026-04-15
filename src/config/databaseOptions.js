const isTruthy = (value) => typeof value === 'string' && value.toLowerCase() === 'true';

const isFalsy = (value) => typeof value === 'string' && value.toLowerCase() === 'false';

const isSupabaseUrl = (databaseUrl) => {
  try {
    const parsed = new URL(databaseUrl);
    return parsed.hostname.includes('supabase.co');
  } catch (error) {
    return false;
  }
};

const resolveSslConfig = ({ databaseUrl, dbSsl }) => {
  if (isTruthy(dbSsl)) {
    return { rejectUnauthorized: false };
  }

  if (isFalsy(dbSsl)) {
    return false;
  }

  return isSupabaseUrl(databaseUrl)
    ? { rejectUnauthorized: false }
    : false;
};

const createDatabaseOptions = ({ databaseUrl, dbSsl }) => ({
  connectionString: databaseUrl,
  ssl: resolveSslConfig({ databaseUrl, dbSsl })
});

module.exports = {
  createDatabaseOptions
};
