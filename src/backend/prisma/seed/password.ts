// Password hashing for seeded accounts (REQ-SEC-001: salted, adaptive hash).
//
// Uses scrypt from node:crypto, which the SRS allows and which needs no extra
// dependency. Format: scrypt$N$r$p$<salt base64>$<hash base64>.
//
// The backend's sign-in must verify this same format, or seeded accounts
// cannot sign in. If the backend settles on bcrypt or Argon2, only this file
// changes.

import { randomBytes, scrypt, type ScryptOptions } from "node:crypto";

const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;

function scryptAsync(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}
