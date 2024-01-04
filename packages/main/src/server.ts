import { createApplication } from './app.js';

process.env['NODE_ENV'] ??= 'development';
const port = process.env['port'] ? parseInt(process.env['port'], 10) : 3000;
const host = process.env['host'] ?? '0.0.0.0';

const start = async () => {
  try {
    const app = await createApplication();
    await app.listen({ port, host });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

await start();
