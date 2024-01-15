import { createApplication } from './app.js';

process.env['NODE_ENV'] ??= 'development';
const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 8080;
const host = process.env['host'] ?? '0.0.0.0';

const start = async () => {
  try {
    const app = await createApplication();
    await app.listen({ port, host });
    console.log(`Server listening on port ${port}...`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

await start();
