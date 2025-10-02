export function escapeMarkdownV2(text: string) {
  if (!text) return text;
  return text.replace(/([_*[\]()~`>#+-=|{}.!])/g, '\\$1');
}
