export type CodeType = "numeric" | "alphanumeric" | "alphabet";

interface GenerateCodeOptions {
  prefix?: string;
  type?: CodeType;
  existing?: Set<string>;
}

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
  options: GenerateCodeOptions = {},
): string {
  const { prefix = "", type = "numeric", existing } = options;
  const charset = getCharset(type);
  let code = "";
  do {
    code = "";
    for (let i = 0; i < digits; i++) {
      code += randomChar(charset);
    }
    code = prefix ? `${prefix}-${code}` : code;
  } while (existing && existing.has(code));
  return code;
}
