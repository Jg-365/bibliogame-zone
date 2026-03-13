export const toSecureAssetUrl = (url?: string | null) => {
  if (!url) return "";

  return url
    .trim()
    .replace(/^http:\/\//i, "https://")
    .replace(/^\/\//, "https://");
};

export const toBookCoverUrl = (url?: string | null) => {
  return toSecureAssetUrl(url)
    .replace(/zoom=\d+/i, "zoom=3")
    .replace(/&edge=curl/gi, "")
    .replace(/&fife=w\d+/gi, "&fife=w800");
};
