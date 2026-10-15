const mysql = require('mysql2/promise');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少数据库配置：${name}`);
  return value;
}

function createPool() {
  return mysql.createPool({
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    database: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 8),
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true
  });
}

module.exports = { createPool };
