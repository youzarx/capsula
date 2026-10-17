import {
  calculateGradientCoordinates,
  checkReversal,
  checkThemeColor,
  generateAutoByTime,
  generateAutoColor,
  generateAutoGradient,
  generateThemeColor,
} from "../utils/setting";
import {
  checkCustomColor,
  isGradientColor,
  isValidFontFamily,
  isValidHexColor,
  normalizeHexColor,
  validateBoundedNumber,
  validateBoundedNumberArray,
  validateCustomColorList,
  validateStringLength,
} from "../src/verification";
import { ColorMap } from "../types/color";
import { parseColor } from "../utils/parse";
import {
  ANIMATION_NAMES,
  getAnimation,
  getDesc,
  getStyle,
  getText,
  getTextBg,
} from "../utils/render";
import { COLOR_PRESETS } from "./capabilities";

export abstract class Model {
  width: number;
  height: number;
  gradientAngle: number;

  type: string;
  section: "footer" | "header";
  reversal: string;
  animation: string;
  rotate: number;

  color: string | ColorMap;
  customColorList: string;
  theme: string;
  gradient?: ColorMap;

  text: string;
  textBg: boolean;
  textBgColor: string;

  desc: string;
  descSize: number;
  descAlign: number;
  descAlignY: number;
  descColor: string;

  fontSize: number;
  fontColor: string;
  fontFamily: string;
  fontAlign: number[];
  fontAlignY: number[];
  stroke: string;
  strokeWidth: number;

  constructor(params: any = {}) {
    this.type = params.type || "wave";

    if (
      params.section !== undefined &&
      params.section !== null &&
      params.section !== ""
    ) {
      if (params.section !== "header" && params.section !== "footer") {
        throw new Error("The value of 'section=' is invalid.");
      }
      this.section = params.section;
    } else {
      this.section = "header";
    }

    // Explicit integer-width policy: validate between 200 and 2500, then round to nearest integer pixel.
    this.width = Math.round(
      validateBoundedNumber(params.width, "width", 200, 2500, 854),
    );
    this.height = validateBoundedNumber(params.height, "height", 1, 2000, 120);
    this.gradientAngle = validateBoundedNumber(
      params.gradientAngle,
      "gradientAngle",
      0,
      360,
      0,
    );
    this.text = validateStringLength(params.text, "text", 1000);
    this.desc = validateStringLength(params.desc, "desc", 1000);
    this.textBg = params.textBg == "true" || params.textBg === true;
    this.fontSize = validateBoundedNumber(
      params.fontSize,
      "fontSize",
      1,
      500,
      70,
    );
    this.descSize = validateBoundedNumber(
      params.descSize,
      "descSize",
      1,
      300,
      20,
    );
    this.rotate = validateBoundedNumber(params.rotate, "rotate", -360, 360, 0);
    this.descAlign = validateBoundedNumber(
      params.descAlign,
      "descAlign",
      -100,
      200,
      50,
    );
    this.descAlignY = validateBoundedNumber(
      params.descAlignY,
      "descAlignY",
      -100,
      200,
      60,
    );

    this.fontAlign = validateBoundedNumberArray(
      params.fontAlign,
      "fontAlign",
      -100,
      200,
      [50],
    );
    this.fontAlignY = validateBoundedNumberArray(
      params.fontAlignY,
      "fontAlignY",
      -100,
      200,
      [50],
    );

    if (
      params.strokeWidth !== undefined &&
      params.strokeWidth !== null &&
      params.strokeWidth !== ""
    ) {
      this.strokeWidth = validateBoundedNumber(
        params.strokeWidth,
        "strokeWidth",
        0,
        100,
        0,
      );
    } else {
      this.strokeWidth = params.stroke === "none" ? 0 : 1;
    }

    if (
      params.stroke !== undefined &&
      params.stroke !== null &&
      params.stroke !== ""
    ) {
      const s = String(params.stroke).trim();
      if (s !== "none" && !isValidHexColor(s)) {
        throw new Error("The value of 'stroke=' is invalid.");
      }
      this.stroke = s === "none" ? "none" : normalizeHexColor(s);
    } else {
      this.stroke = params.strokeWidth ? "B897FF" : "none";
    }

    if (
      params.fontColor !== undefined &&
      params.fontColor !== null &&
      params.fontColor !== ""
    ) {
      const fc = String(params.fontColor).trim();
      if (!isValidHexColor(fc)) {
        throw new Error("The value of 'fontColor=' is invalid.");
      }
      this.fontColor = normalizeHexColor(fc);
    } else {
      this.fontColor = undefined as any;
    }

    if (
      params.descColor !== undefined &&
      params.descColor !== null &&
      params.descColor !== ""
    ) {
      const dc = String(params.descColor).trim();
      if (!isValidHexColor(dc)) {
        throw new Error("The value of 'descColor=' is invalid.");
      }
      this.descColor = normalizeHexColor(dc);
    } else {
      this.descColor = "000000";
    }

    if (
      params.textBgColor !== undefined &&
      params.textBgColor !== null &&
      params.textBgColor !== ""
    ) {
      const tbc = String(params.textBgColor).trim();
      if (!isValidHexColor(tbc)) {
        throw new Error("The value of 'textBgColor=' is invalid.");
      }
      this.textBgColor = normalizeHexColor(tbc);
    } else {
      this.textBgColor = "000000";
    }

    if (
      params.fontFamily !== undefined &&
      params.fontFamily !== null &&
      params.fontFamily !== ""
    ) {
      const ff = String(params.fontFamily);
      if (!isValidFontFamily(ff)) {
        throw new Error("The value of 'fontFamily=' is invalid.");
      }
      this.fontFamily = ff;
    } else {
      this.fontFamily =
        "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji";
    }

    if (
      params.animation !== undefined &&
      params.animation !== null &&
      params.animation !== ""
    ) {
      const anim = String(params.animation).trim();
      if (!ANIMATION_NAMES.includes(anim as any)) {
        throw new Error("The value of 'animation=' is invalid.");
      }
      this.animation = anim;
    } else {
      this.animation = "fadeIn";
    }

    this.reversal = checkReversal(params.reversal || "false");
    this.customColorList = validateCustomColorList(params.customColorList);

    if (
      params.theme !== undefined &&
      params.theme !== null &&
      params.theme !== "" &&
      params.theme !== "none"
    ) {
      if (!checkThemeColor(params.theme)) {
        throw new Error("The value of 'theme=' is invalid.");
      }
      this.theme = params.theme;
    } else {
      this.theme = params.theme || "none";
    }

    this.color = params.color || "B897FF";

    if (this.theme !== "none" && checkThemeColor(this.theme)) {
      [this.color, this.fontColor, this.textBgColor] = generateThemeColor(
        this.theme,
      );
      this.descColor = this.textBgColor;
    } else {
      if (this.color === COLOR_PRESETS.auto) {
        [this.color, this.fontColor, this.textBgColor] = generateAutoColor(
          this.fontColor,
          this.customColorList,
        );
      } else if (this.color === COLOR_PRESETS.gradient) {
        [this.color, this.fontColor, this.textBgColor] = generateAutoGradient(
          this.fontColor,
          this.customColorList,
        );
      } else if (
        this.color === COLOR_PRESETS.timeAuto ||
        this.color === COLOR_PRESETS.timeGradient
      ) {
        [this.color, this.fontColor, this.textBgColor] = generateAutoByTime(
          this.color,
          this.fontColor,
        );
      } else if (this.color === "random") {
        // Handled by parseColor
      } else {
        this.color = checkCustomColor(this.color);
      }
      if (params.descColor === undefined || params.descColor === "") {
        this.descColor = this.fontColor;
      }
    }

    if (isGradientColor(this.color)) {
      this.gradient = this.color as ColorMap;
    }
    this.color = parseColor(this.color);
  }

  protected _drawGradient() {
    if (!this.gradient || !isGradientColor(this.gradient)) return "";

    const offset = Object.entries(this.gradient)
      .map(([key, value]) => `<stop offset="${key}%" stop-color="#${value}"/>`)
      .join("");

    const coords = calculateGradientCoordinates(this.gradientAngle);

    return `<defs>
              <linearGradient id="linear" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">
                ${offset}
              </linearGradient>
            </defs>`;
  }

  protected _drawText() {
    const textBgScript = this.textBg
      ? getTextBg(
          this.textBgColor,
          this.fontAlign,
          this.fontAlignY,
          this.fontSize,
          this.text,
        )
      : "";

    const textContent = getText(
      this.text,
      this.fontColor,
      this.fontAlign,
      this.fontAlignY,
      this.stroke,
      this.strokeWidth,
    );

    return `${textBgScript} ${textContent}`;
  }

  protected _drawStyle() {
    return `<style>
      ${getStyle(
        this.section,
        this.fontSize,
        this.descSize,
        this.rotate,
        this.fontFamily,
      )}
      ${getAnimation(this.animation)}
    </style>`;
  }

  protected _drawDesc() {
    return getDesc(this.desc, this.descColor, this.descAlign, this.descAlignY);
  }

  /**
   * draw <path/>
   */
  abstract path(): string | string[];

  /**
   * draw content
   */
  abstract content(): string;

  /**
   * draw render
   */
  render() {
    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        ${this._drawStyle()}
        ${this._drawGradient()}
        ${this.content()}
        ${this._drawText()}
        ${this._drawDesc()}
      </svg>
    `;
  }
}
