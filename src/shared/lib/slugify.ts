/** "What is a Closure?" -> "what-is-a-closure": lowercase letters and digits joined by single hyphens (the API's slug rule). */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
