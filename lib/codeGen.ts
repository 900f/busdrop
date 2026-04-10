// Generates human-readable 6-char codes like "DROP-XK9F2"
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

export function formatCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}
