import Ajv2020 from 'ajv/dist/2020.js';
//Schemas
import addFormats from 'ajv-formats';

export const createDefaultAjv = () => {
  // eslint-disable-next-line new-cap
  const ajv = new Ajv2020.default({
    coerceTypes: 'array',
    useDefaults: true,
    removeAdditional: true,
    allErrors: false,
    strict: false,
    strictRequired: false,
  });

  addFormats.default(ajv);

  return ajv;
};
