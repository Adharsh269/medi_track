import { createApp } from './app.js';
import { pool } from './config/db.js';

// This API-only assignment has no login or authorization middleware.
// Keep it local; integrate authentication before deployment or real-user access.
if (process.env.NODE_ENV === 'production') {
  throw new Error('Add authentication/authorization before production deployment.');
}
const app = createApp(pool);
const port = Number(process.env.PORT || 5000);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Database API running at http://127.0.0.1:${port}`);
});
function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
