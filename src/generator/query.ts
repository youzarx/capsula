import type { ExportFormat, GeneratorQuery } from "./types";

export type PublicApiResolution = {
  baseUrl: string;
  isConfigured: boolean;
  message?: string;
};

/**
 * Resolves the public API base URL safely according to Capsula policies:
 * 1. Explicitly configured VITE_PUBLIC_API_URL (env var)
 * 2. Non-local production origin (`window.location.origin + "/api"`)
 * 3. Local/unconfigured fallback: marks isConfigured = false and provides a clean placeholder
 */
export function resolvePublicApiBase(): PublicApiResolution {
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_API_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return {
          baseUrl: trimmed,
          isConfigured: true,
        };
      }
    } catch {
      // Invalid URL format, fall through to auto-detection
    }
  }

  if (typeof window !== "undefined" && window.location) {
    const { hostname, origin } = window.location;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local") ||
      hostname === "";

    if (!isLocal && origin && origin !== "null") {
      return {
        baseUrl: `${origin}/api`,
        isConfigured: true,
      };
    }
  }

  return {
    baseUrl: "https://<your-deployed-domain>/api",
    isConfigured: false,
    message:
      "Public snippets require a deployed domain or VITE_PUBLIC_API_URL configured.",
  };
}

export function createQueryString(query: GeneratorQuery): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === "" || value === undefined || value === null) return;
    // Don't emit default values that clutter the URL
    if (key === "theme" && value === "none") return;
    if (key === "width" && String(value) === "854") return;
    if (key === "gradientAngle" && String(value) === "0") return;
    if (key === "strokeWidth" && String(value) === "0") return;
    if (key === "rotate" && String(value) === "0") return;
    if (key === "reversal" && value === false) return;
    if (key === "textBg" && value === false) return;

    params.set(key, String(value));
  });

  return params.toString();
}

export function createPublicImageUrl(queryString: string): string {
  const { baseUrl } = resolvePublicApiBase();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function formatSnippet(
  format: ExportFormat,
  url: string,
  altText = "Capsula Header",
): string {
  switch (format) {
    case "markdown":
      return `![${altText}](${url})`;
    case "html":
      return `<img src="${url}" alt="${altText}" />`;
    case "url":
    default:
      return url;
  }
}

