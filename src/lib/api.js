const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim();

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

export const buildApiUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
