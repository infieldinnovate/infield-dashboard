export type CodeType = "numeric" | "alphanumeric" | "alphabet";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMERIC = "0123456789";
const ALPHANUMERIC = ALPHABET + NUMERIC;

function randomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

function getCharset(type: CodeType): string {
  switch (type) {
    case "numeric":
      return NUMERIC;
    case "alphabet":
      return ALPHABET;
    case "alphanumeric":
    default:
      return ALPHANUMERIC;
  }
}

export function generateCode(
  digits: number,
  type: CodeType = "alphanumeric",
): string {
  const charset = getCharset(type);
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

export function generateNumericId(): string {
  return generateCode(6, "numeric");
}

export function generateProductId(): string {
  return generateCode(5, "numeric");
}

export function generatePrefixedId(
  prefix: string,
  digits = 6,
  type: CodeType = "numeric",
): string {
  return `${prefix}-${generateCode(digits, type)}`;
}

export function generateReceiptNumber(): string {
  return `POS-${generateCode(6, "numeric")}`;
}
