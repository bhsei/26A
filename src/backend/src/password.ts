import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;

function scryptAsync(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, nRaw, rRaw, pRaw, saltRaw, hashRaw, ...extra] = encoded.split("$");
  if (scheme !== "scrypt" || extra.length > 0) return false;

  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![N, r, p].every(Number.isInteger) || N < 16384 || r < 8 || p < 1) return false;

  try {
    const salt = Buffer.from(saltRaw ?? "", "base64");
    const expected = Buffer.from(hashRaw ?? "", "base64");
    if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;
    const actual = await scryptAsync(password, salt, { N, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
