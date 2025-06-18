import { customAlphabet, nanoid } from 'nanoid';

export function generateNanoIdDefault(): string {
  return nanoid();
}

export function generateCustomNanoId(
  length: number,
  alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
  const customNanoId = customAlphabet(alphabet, length);
  return customNanoId();
}
