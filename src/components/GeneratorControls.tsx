import {
  Button,
  Input,
  InputDesc,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectToggle,
  Switch,
} from "bmates-ui";
import type { ChangeEvent } from "react";
import {
  COLOR_FIELDS,
  DESCRIPTION_FIELDS,
  GRADIENT_ANGLE_PRESETS,
  SHAPE_FIELDS,
  TEXT_FIELDS,
  THEME_OPTIONS,
  THEME_REGISTRY,
  WIDTH_PRESETS,
} from "../generator/config";
import type { FieldConfig, GeneratorQuery, QueryKey } from "../generator/types";

type GeneratorControlsProps = {
  query: GeneratorQuery;
  typeOptions: readonly string[];
  animationOptions: readonly string[];
  colorPresets: readonly string[];
  themeOptions?: readonly string[];
  onChange: <K extends QueryKey>(key: K, value: GeneratorQuery[K]) => void;
  onReset: () => void;
};

type FieldProps = Pick<GeneratorControlsProps, "query" | "onChange"> & {
  field: FieldConfig;
};

function titleCase(value: string) {
  if (!value) return "None";
  return value
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function GeneratorField({ field, query, onChange }: FieldProps) {
  const value = query[field.key];
  const inputValue = String(value);
  const fieldId = `generator-${field.key}`;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(field.key, event.target.value as never);
  };

  if (field.type === "select" && field.options) {
    return (
      <div className={`field${field.wide ? " field--wide" : ""}`}>
        <Label htmlFor={fieldId}>{field.label}</Label>
        <Select
          value={[
            {
              label: titleCase(inputValue),
              textValue: inputValue,
              value: inputValue,
            },
          ]}
          onValueChange={selection =>
            onChange(field.key, String(selection[0]?.value ?? "") as never)
          }
        >
          <SelectToggle id={fieldId} className="field-select">
            {titleCase(inputValue)}
          </SelectToggle>
          <SelectContent>
            {field.options.map(option => (
              <SelectItem key={option || "none"} value={option}>
                {titleCase(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.description && <InputDesc>{field.description}</InputDesc>}
      </div>
    );
  }

  if (field.type === "range") {
    return (
      <div className="field field--range">
        <div className="field-label-row">
          <Label htmlFor={fieldId}>{field.label}</Label>
          <output htmlFor={fieldId}>{inputValue}</output>
        </div>
        <Input
          id={fieldId}
          type="range"
          min={field.min}
          max={field.max}
          step="1"
          value={inputValue}
          onChange={handleInputChange}
        />
        {field.description && <InputDesc>{field.description}</InputDesc>}
      </div>
    );
  }

  return (
    <div className={`field${field.wide ? " field--wide" : ""}`}>
      <Label htmlFor={fieldId}>{field.label}</Label>
      <Input
        id={fieldId}
        type={field.type}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        list={field.options?.length ? `${fieldId}-suggestions` : undefined}
        value={inputValue}
        onChange={handleInputChange}
      />
      {field.options?.length ? (
        <datalist id={`${fieldId}-suggestions`}>
          {field.options.map(option => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
      {field.description && <InputDesc>{field.description}</InputDesc>}
    </div>
  );
}

function FieldGrid({
  fields,
  query,
  onChange,
}: Pick<FieldProps, "query" | "onChange"> & {
  fields: readonly FieldConfig[];
}) {
  return (
    <div className="field-grid">
      {fields.map(field => (
        <GeneratorField
          key={field.key}
          field={field}
          query={query}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export function GeneratorControls({
  query,
  typeOptions,
  animationOptions,
  colorPresets,
  themeOptions = THEME_OPTIONS,
  onChange,
  onReset,
}: GeneratorControlsProps) {
  const shapeFields = SHAPE_FIELDS.map(field =>
    field.key === "type" ? { ...field, options: typeOptions } : field,
  );
  const colorFields = COLOR_FIELDS.map(field => {
    if (field.key === "color") return { ...field, options: colorPresets };
    if (field.key === "theme") return { ...field, options: themeOptions };
    return field;
  });
  const textFields = TEXT_FIELDS.map(field =>
    field.key === "animation" ? { ...field, options: animationOptions } : field,
  );

  return (
    <div className="generator-controls">
      <div className="tab-heading">
        <div>
          <h2>Settings</h2>
        </div>
        <Button
          className="reset-button"
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
          Reset all
        </Button>
      </div>

      {/* Section 01: Dimensions & Shape */}
      <section className="setting-section" aria-labelledby="shape-settings">
        <div className="setting-section-heading">
          <span className="section-num">01</span>
          <div>
            <h3 id="shape-settings">Shape & Dimensions</h3>
          </div>
        </div>
        <FieldGrid fields={shapeFields} query={query} onChange={onChange} />

        <div className="quick-presets">
          <span className="preset-label">Width Presets:</span>
          <div className="preset-buttons">
            {WIDTH_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                className={`preset-pill${query.width === preset.value ? " preset-pill--active" : ""}`}
                onClick={() => onChange("width", preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="switch-grid">
          <Switch
            checked={query.reversal}
            label="Reverse direction"
            onCheckedChange={checked => onChange("reversal", checked)}
          />
        </div>
      </section>

      {/* Section 02: Theme, Color & Gradient Angle */}
      <section className="setting-section" aria-labelledby="color-settings">
        <div className="setting-section-heading">
          <span className="section-num">02</span>
          <div>
            <h3 id="color-settings">Theme & Lighting</h3>
          </div>
        </div>
        <FieldGrid fields={colorFields} query={query} onChange={onChange} />

        {/* Quick Gradient Cardinal Angle Buttons */}
        <div className="quick-presets">
          <span className="preset-label">Cardinal Angles:</span>
          <div className="preset-buttons">
            {GRADIENT_ANGLE_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                className={`preset-pill${query.gradientAngle === preset.value ? " preset-pill--active" : ""}`}
                onClick={() => onChange("gradientAngle", preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Theme Palette Swatches */}
        {query.theme !== "none" && THEME_REGISTRY[query.theme] && (
          <div className="theme-swatch-card">
            <span className="theme-swatch-title">
              Active Theme: {titleCase(query.theme)}
            </span>
            <div className="theme-swatch-row">
              <div
                className="theme-chip"
                style={{ backgroundColor: `#${THEME_REGISTRY[query.theme].color}` }}
                title={`Header Color: #${THEME_REGISTRY[query.theme].color}`}
              >
                <span>Bg</span>
              </div>
              <div
                className="theme-chip"
                style={{ backgroundColor: `#${THEME_REGISTRY[query.theme].text}` }}
                title={`Text Color: #${THEME_REGISTRY[query.theme].text}`}
              >
                <span>Text</span>
              </div>
              <div
                className="theme-chip"
                style={{ backgroundColor: `#${THEME_REGISTRY[query.theme].textBg}` }}
                title={`Accent Color: #${THEME_REGISTRY[query.theme].textBg}`}
              >
                <span>Accent</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 03: Typography & Text */}
      <section className="setting-section" aria-labelledby="text-settings">
        <div className="setting-section-heading">
          <span className="section-num">03</span>
          <div>
            <h3 id="text-settings">Typography & Text</h3>
          </div>
        </div>
        <FieldGrid fields={textFields} query={query} onChange={onChange} />
        <div className="switch-grid">
          <Switch
            checked={query.textBg}
            label="Show text background badge"
            onCheckedChange={checked => onChange("textBg", checked)}
          />
        </div>
      </section>

      {/* Section 04: Subtitle / Description */}
      <section
        className="setting-section"
        aria-labelledby="description-settings"
      >
        <div className="setting-section-heading">
          <span className="section-num">04</span>
          <div>
            <h3 id="description-settings">Subtitle / Description</h3>
          </div>
        </div>
        <FieldGrid
          fields={DESCRIPTION_FIELDS}
          query={query}
          onChange={onChange}
        />
      </section>
    </div>
  );
}

