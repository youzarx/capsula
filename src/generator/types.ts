export type GeneratorQuery = {
  type: string;
  width: string;
  height: string;
  color: string;
  theme: string;
  gradientAngle: string;
  section: "header" | "footer";
  reversal: boolean;
  text: string;
  textBg: boolean;
  fontColor: string;
  fontSize: string;
  fontAlign: string;
  fontAlignY: string;
  animation: string;
  rotate: string;
  stroke: string;
  strokeWidth: string;
  desc: string;
  descSize: string;
  descAlign: string;
  descAlignY: string;
};

export type QueryKey = keyof GeneratorQuery;

export type FieldConfig = {
  key: QueryKey;
  label: string;
  type: "text" | "number" | "range" | "select";
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  wide?: boolean;
  options?: readonly string[];
};

export type BackdropMode = "obsidian" | "github-dark" | "light" | "checkerboard";

export type ExportFormat = "markdown" | "html" | "url";

