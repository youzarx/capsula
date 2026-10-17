import { Button, Card, CardBody } from "bmates-ui";
import { useEffect, useMemo, useState } from "react";
import { GeneratorControls } from "./components/GeneratorControls";
import { PreviewPanel } from "./components/PreviewPanel";
import {
  DEFAULT_QUERY,
  FALLBACK_ANIMATION_OPTIONS,
  FALLBACK_COLOR_PRESETS,
  FALLBACK_SHAPE_TYPES,
  THEME_OPTIONS,
} from "./generator/config";
import { createPublicImageUrl, createQueryString } from "./generator/query";
import type { GeneratorQuery, QueryKey } from "./generator/types";

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Permission denied or sandboxed context; fall through to textarea fallback
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, value.length);
    const success = document.execCommand("copy");
    textarea.remove();
    return success;
  } catch {
    return false;
  }
}

export default function App() {
  const [query, setQuery] = useState<GeneratorQuery>(DEFAULT_QUERY);
  const [typeOptions, setTypeOptions] =
    useState<readonly string[]>(FALLBACK_SHAPE_TYPES);
  const [animationOptions, setAnimationOptions] = useState<readonly string[]>(
    FALLBACK_ANIMATION_OPTIONS,
  );
  const [colorPresets, setColorPresets] = useState<readonly string[]>(
    FALLBACK_COLOR_PRESETS,
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const queryString = useMemo(() => createQueryString(query), [query]);
  const publicUrl = useMemo(
    () => createPublicImageUrl(queryString),
    [queryString],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("capsula-theme", theme);
  }, [theme]);

  // Dynamically load available models, animations, and color presets from API
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/options", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Unable to load generator options.");
        return response.json();
      })
      .then(
        (options: {
          types?: unknown;
          animations?: unknown;
          colorPresets?: unknown;
        }) => {
          if (
            Array.isArray(options.types) &&
            options.types.every(value => typeof value === "string")
          ) {
            setTypeOptions(options.types);
          }
          if (
            Array.isArray(options.animations) &&
            options.animations.every(value => typeof value === "string")
          ) {
            setAnimationOptions(["", ...options.animations]);
          }
          if (
            Array.isArray(options.colorPresets) &&
            options.colorPresets.every(value => typeof value === "string")
          ) {
            setColorPresets(options.colorPresets);
          }
        },
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Keep established fallback lists if API options endpoint is offline
      });

    return () => controller.abort();
  }, []);

  const updateQuery = <K extends QueryKey>(
    key: K,
    value: GeneratorQuery[K],
  ) => {
    setQuery(current => ({ ...current, [key]: value }));
  };

  return (
    <main className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="https://github.com/youzarx/Capsula"
          target="_blank"
          rel="noreferrer"
        >
          <span className="brand-logo">Capsula</span>
          <span className="brand-tag">v2.0</span>
        </a>

        <div className="header-actions">
          <a
            className="header-link"
            href="https://github.com/youzarx/Capsula"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Button
            className="theme-toggle"
            variant="ghost"
            size="icon"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            onClick={() =>
              setTheme(current => (current === "light" ? "dark" : "light"))
            }
          >
            {theme === "light" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v2m0 14v2M3 12h2m14 0h2m-2.6-6.4-1.4 1.4M6.4 17.6 5 19m0-14 1.4 1.4m11.2 11.2 1.4 1.4" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z" />
              </svg>
            )}
          </Button>
        </div>
      </header>

      <section className="page-intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Capsula Playground</p>
          <h1 id="page-title">Visuals, generated by code.</h1>
          <p className="intro-subtitle">
            Configure shapes, dynamic dimensions, lighting angles, and themes in real time. Copy verified Markdown and HTML snippets for your GitHub profile.
          </p>
        </div>
      </section>

      <div className="workspace">
        <Card className="controls-card">
          <CardBody>
            <GeneratorControls
              query={query}
              typeOptions={typeOptions}
              animationOptions={animationOptions}
              colorPresets={colorPresets}
              themeOptions={THEME_OPTIONS}
              onChange={updateQuery}
              onReset={() => setQuery(DEFAULT_QUERY)}
            />
          </CardBody>
        </Card>
        <PreviewPanel
          query={query}
          imageUrl={`/api?${queryString}`}
          publicUrl={publicUrl}
          headerTitle={query.text || "Capsula"}
          onCopy={copyText}
        />
      </div>

      <footer className="site-footer">
        <p className="footer-attribution">
          <strong>Capsula</strong> — An enhanced evolution of{" "}
          <a
            href="https://github.com/kyechan99/capsule-render"
            target="_blank"
            rel="noreferrer"
          >
            capsule-render
          </a>{" "}
          by kyechan99, licensed under the{" "}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noreferrer"
          >
            MIT License
          </a>
          . Developed for the <strong>youzarx</strong> profile ecosystem.
        </p>
      </footer>
    </main>
  );
}

