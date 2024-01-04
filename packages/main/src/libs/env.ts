import { ProcessEnvStorageEnvironmentClient, jsonProcessEnvKeyLoader, yamlFileKeyLoader } from '@efebia/env-loader';
import { readFileSync } from 'node:fs';

const retrieveLoader = () => {
  if (process.env['COPILOT_APPLICATION_NAME']) return jsonProcessEnvKeyLoader('envs');
  if (process.env['GENERATION']) return () => {};
  return yamlFileKeyLoader(
    readFileSync(process.env['TESTING'] ? './env.testing.yml' : './env.local.yml', { encoding: 'utf-8' }),
  );
};

const loader = retrieveLoader();

const environmentClient = new ProcessEnvStorageEnvironmentClient({
  loadSyncKeysAtStartup: true,
  syncKeyLoaders: [loader],
});

export const getEnv: typeof environmentClient.getEnv = environmentClient.getEnv.bind(environmentClient);
export const getOptionalEnv: typeof environmentClient.getOptionalEnv =
  environmentClient.getOptionalEnv.bind(environmentClient);
