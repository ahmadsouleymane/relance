export function stripDiacritics(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, ""); // é -> e, etc.
}

export function slugify(text) {
  return stripDiacritics(text.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
