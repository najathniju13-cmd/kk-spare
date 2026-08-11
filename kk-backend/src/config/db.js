const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kk_spare_parts',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  queueLimit: 0,
};

// Only enable SSL if explicitly requested via DB_SSL=true env var
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

let pool;
if (process.env.DATABASE_URL || process.env.DB_URI) {
  const connStr = process.env.DATABASE_URL || process.env.DB_URI;
  pool = mysql.createPool(connStr);
} else {
  pool = mysql.createPool(dbConfig);
}

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err);
});

// Auto retry transient connection lost errors
const origExecute = pool.execute.bind(pool);
const origQuery = pool.query.bind(pool);

async function autoRetry(fn, args, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn(...args);
    } catch (err) {
      const isConnLost = err.code === 'PROTOCOL_CONNECTION_LOST' || 
                         err.code === 'ECONNRESET' || 
                         err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
                         (err.message && err.message.includes('Connection lost'));
      if (isConnLost && i < retries - 1) {
        console.warn(`[DB] Connection lost, retrying query (attempt ${i + 1})...`);
        await new Promise(res => setTimeout(res, 500));
        continue;
      }
      throw err;
    }
  }
}

pool.execute = (...args) => autoRetry(origExecute, args);
pool.query = (...args) => autoRetry(origQuery, args);

module.exports = pool;