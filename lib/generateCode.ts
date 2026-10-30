export type CodeType = "numeric" | "alphanumeric" | "alphabet";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMERIC = "0123456789";
const ALPHANUMERIC = ALPHABET + NUMERIC;

function randomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

export function generateCode(
  digits: number,
  type: CodeType = "alphanumeric",
): string {
  let charset: string;
  switch (type) {
    case "numeric":
      charset = NUMERIC;
      break;
    case "alphabet":
      charset = ALPHABET;
      break;
    case "alphanumeric":
    default:
      charset = ALPHANUMERIC;
      break;
  }

  let code = "";
  for (let i = 0; i < digits; i++) {
    code += randomChar(charset);
  }
  return code;
}

export function generateUniqueCode(
  digits: number,
  existing: Set<string>,
  type: CodeType = "alphanumeric",
): string {
  let code = "";
  do {
    code = generateCode(digits, type);
  } while (existing.has(code));
  return code;
}
