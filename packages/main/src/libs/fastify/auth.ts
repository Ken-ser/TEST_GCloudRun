/* eslint-disable import/no-named-as-default-member */
import { hash as argonHash, verify as argonVerify } from 'argon2';
import { createHash, randomBytes } from 'crypto';
import type { FastifyRequest } from 'fastify';

// eslint-disable-next-line import/default
import JWT from 'jsonwebtoken';
import { z } from 'zod';
import { getEnv } from '../env.js';

const { JWTsecret, JWTalgorithm: algorithm, JWTexpire: expiresIn } = getEnv('JWTsecret', 'JWTalgorithm', 'JWTexpire');

const hash = (data: any) => {
  const digest = createHash('sha256').update(data).digest('hex');

  return digest;
};

const argonOptions = {
  // eslint-disable-next-line no-bitwise
  memoryCost: 1 << 12,
  parallelism: 1,
};

export const hashPassword = async (inputPassword: string) => {
  const hashedPassword = await argonHash(inputPassword, argonOptions);
  return hashedPassword;
};

export const verifyPassword = async (savedPassword: string, inputClearPassword: string) => {
  const match = await argonVerify(savedPassword, inputClearPassword, argonOptions);
  return match;
};

const createJWT = (payload: NonNullable<FastifyRequest['jwt']>) => {
  const options = { algorithm: algorithm as JWT.Algorithm, expiresIn };
  const token = JWT.sign(payload, JWTsecret, options);
  return token;
};

const verifyJWT = (token: string) => JWT.verify(token, JWTsecret);

const createApiKey = () => {
  const buffer = randomBytes(32);
  const apiKey = buffer.toString('hex');

  return apiKey;
};

const validatePassword = (password: string) => {
  const result = {
    valid: true,
    message: '',
  };

  if (!/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/u.test(password)) {
    result.valid = false;
    result.message =
      'Password not valid: min 8 characters, min 1 upper case letter, 1 lower case letter, 1 number and 1 special character';
  }

  return result;
};

const validateEmail = (email: string) => {
  const result = {
    valid: true,
    message: '',
  };

  try {
    z.string().email().parse(email);
  } catch {
    result.valid = false;
    result.message = 'Email format not valid';
  }

  return result;
};

export { createApiKey, createJWT, hash, validateEmail, validatePassword, verifyJWT };
