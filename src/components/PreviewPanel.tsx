import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardBody,
  CardHead,
  CardTitle,
} from "bmates-ui";
import { useEffect, useRef, useState } from "react";
import Models from "../../model";
import { regexData } from "../verification";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatSnippet, resolvePublicApiBase } from "../generator/query";
import type { BackdropMode, ExportFormat, GeneratorQuery } from "../generator/types";

type PreviewPanelProps = {
  query: GeneratorQuery;
  imageUrl: string;
  publicUrl: string;
  onCopy: (text: string) => Promise<boolean>;
  headerTitle?: string;
};

const BACKDROP_OPTIONS: { id: BackdropMode; label: string; iconBg: string }[] = [
  { id: "obsidian", label: "Obsidian", iconBg: "#090a0f" },
  { id: "github-dark", label: "GitHub Dark", iconBg: "#0d1117" },
  { id: "light", label: "Light", iconBg: "#ffffff" },
  { id: "checkerboard", label: "Grid", iconBg: "repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 50% / 8px 8px" },
];

export function PreviewPanel({
  query,
  imageUrl,
  publicUrl,
  onCopy,
  headerTitle = "Capsula Header",
}: PreviewPanelProps) {
  const debouncedQuery = useDebouncedValue(query, 120);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [svgBlobUrl, setSvgBlobUrl] = useState<string | null>(null);
  const [backdrop, setBackdrop] = useState<BackdropMode>("obsidian");
  const [scaleMode, setScaleMode] = useState<"fit" | "actual">("fit");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const blobUrlRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const publicResolution = resolvePublicApiBase();
  const currentSnippet = formatSnippet(exportFormat, publicUrl, headerTitle || "Capsula");
  const currentWidth = debouncedQuery.width || "854";
  const currentHeight = debouncedQuery.height || "300";

  // Render SVG reliably using the shared Models engine with validation & blob management
  useEffect(() => {
    let isCurrent = true;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const rawType = debouncedQuery.type;
      const type = rawType ? regexData(rawType) : "wave";
      if (!type || !(type in (Models as Record<string, unknown>))) {
        throw new Error("The value of 'type=' is invalid.");
      }

      const ModelClass = (Models as Record<string, any>)[type];
      const model = new ModelClass(debouncedQuery);
      const svgText = model.render();

      if (!isCurrent) return;

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const newBlobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = newBlobUrl;
      setSvgBlobUrl(newBlobUrl);
      setStatus("ready");
    } catch (error: unknown) {
      if (!isCurrent) return;
      setErrorMessage(
        error instanceof Error ? error.message : "Preview rendering failed.",
      );
      setStatus("error");
    }

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  // Clean up blob URL on component unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleCopyClick = async () => {
    const success = await onCopy(currentSnippet);
    if (success) {
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } else {
      setCopyStatus("failed");
      textareaRef.current?.select();
    }
  };

  return (
    <Card className="preview-card">
      <CardHead className="preview-heading">
        <div>
          <p className="eyebrow">Real-Time Preview</p>
          <div className="preview-title-row">
            <CardTitle>Generated Header</CardTitle>
            <span className="dimensions-badge" title="Generated SVG dimensions">
              {currentWidth} × {currentHeight} px
            </span>
          </div>
        </div>
        <div className="preview-status-badge">
          <Badge
            variant={
              status === "error"
                ? "danger"
                : status === "ready"
                  ? "success"
                  : "secondary"
            }
          >
            {status === "error"
              ? "Invalid Input"
              : status === "ready"
                ? "Live"
                : "Rendering…"}
          </Badge>
        </div>
      </CardHead>

      <CardBody className="preview-body">
        {/* Preview Stage Toolbar: Backdrops & Zoom Mode */}
        <div className="preview-toolbar">
          <div className="toolbar-group">
            <span className="toolbar-label">Canvas:</span>
            <div className="backdrop-buttons">
              {BACKDROP_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`backdrop-btn${backdrop === opt.id ? " backdrop-btn--active" : ""}`}
                  onClick={() => setBackdrop(opt.id)}
                  title={`Preview on ${opt.label} background`}
                  aria-pressed={backdrop === opt.id}
                >
                  <span
                    className="backdrop-swatch"
                    style={{ background: opt.iconBg }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-group">
            <span className="toolbar-label">Zoom:</span>
            <div className="scale-toggle" role="group" aria-label="Preview zoom mode">
              <button
                type="button"
                className={`scale-btn${scaleMode === "fit" ? " scale-btn--active" : ""}`}
                onClick={() => setScaleMode("fit")}
                title="Fit to card width"
                aria-pressed={scaleMode === "fit"}
              >
                Fit
              </button>
              <button
                type="button"
                className={`scale-btn${scaleMode === "actual" ? " scale-btn--active" : ""}`}
                onClick={() => setScaleMode("actual")}
                title="View at 1:1 actual pixel dimensions"
                aria-pressed={scaleMode === "actual"}
              >
                1:1
              </button>
            </div>
          </div>
        </div>

        {/* Live SVG Stage */}
        <div
          className={`image-stage image-stage--${backdrop}${scaleMode === "actual" ? " image-stage--scrollable" : ""}`}
          aria-busy={status === "loading"}
        >
          {svgBlobUrl && status !== "error" && (
            <img
              key={svgBlobUrl}
              src={svgBlobUrl}
              alt={headerTitle}
              className={`preview-svg-image preview-svg-image--${scaleMode}`}
              style={
                scaleMode === "actual"
                  ? { width: `${currentWidth}px`, height: `${currentHeight}px` }
                  : undefined
              }
            />
          )}

          {status === "loading" && (
            <div className="image-loading">
              <span className="spinner" />
              <span>Rendering preview…</span>
            </div>
          )}

          {status === "error" && (
            <div className="preview-error-box">
              <Alert variant="danger">
                <AlertDescription>
                  <strong>Rendering Error:</strong>{" "}
                  {errorMessage || "The local API was unable to render this configuration."}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Snippet Export Section */}
        <div className="export-container">
          <div className="export-tabs-header">
            <span className="export-label">Export Snippet:</span>
            <div className="export-tabs">
              {(["markdown", "html", "url"] as const).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  className={`export-tab${exportFormat === fmt ? " export-tab--active" : ""}`}
                  onClick={() => {
                    setExportFormat(fmt);
                    setCopyStatus("idle");
                  }}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="snippet-display">
            <textarea
              ref={textareaRef}
              readOnly
              className="snippet-textarea"
              rows={2}
              value={currentSnippet}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
              aria-label="Generated snippet code"
            />
          </div>

          {!publicResolution.isConfigured && (
            <div className="notice-banner">
              <svg viewBox="0 0 24 24" className="notice-icon" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>
                {publicResolution.message} Preview uses local relative API.
              </span>
            </div>
          )}

          {copyStatus === "failed" && (
            <div className="copy-failed-banner">
              Automatic clipboard write blocked by browser. Please select the box above and press <strong>Ctrl+C</strong> (or <strong>Cmd+C</strong>).
            </div>
          )}

          <div className="preview-actions">
            <Button variant="primary" onClick={handleCopyClick}>
              {copyStatus === "copied" ? (
                <svg
                  className="action-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : (
                <svg
                  className="action-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
                </svg>
              )}
              {copyStatus === "copied" ? "Copied to Clipboard!" : `Copy ${exportFormat.toUpperCase()}`}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const targetUrl = svgBlobUrl || imageUrl;
                window.open(targetUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Open Live SVG
              <svg className="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3h7v7" />
                <path d="M10 14 21 3" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

