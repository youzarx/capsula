import { ColorMap } from "../types/color";

export const isGradientColor = (color: any) => {
  if (!color) return false;
  return typeof color === "object";
};

export const regexData = (data: any) => {
  return String(data)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
};

export const isValidHexColor = (color: string): boolean => {
  if (typeof color !== "string") return false;
  return /^#?[0-9a-fA-F]{3,8}$/.test(color.trim());
};

export const normalizeHexColor = (color: string): string => {
  return color.trim().replace(/^#/, "");
};

export const isValidFontFamily = (fontFamily: string): boolean => {
  if (typeof fontFamily !== "string" || fontFamily.trim() === "") return false;
  if (/[<>{};\\/*]/.test(fontFamily)) return false;
  return /^[a-zA-Z0-9\s,._\-'"@]+$/.test(fontFamily);
};

export const validateBoundedNumber = (
  value: any,
  name: string,
  min: number,
  max: number,
  defaultValue: number,
): number => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`The value of '${name}=' is invalid.`);
  }
  return num;
};

export const validateBoundedNumberArray = (
  value: any,
  name: string,
  min: number,
  max: number,
  defaultArray: number[] = [50],
): number[] => {
  if (value === undefined || value === null || value === "") {
    return defaultArray;
  }
  const raw = Array.isArray(value) ? value.join(",") : String(value);
  const parts = raw.split(",");
  const numbers: number[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === "") {
      throw new Error(`The value of '${name}=' is invalid.`);
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < min || num > max) {
      throw new Error(`The value of '${name}=' is invalid.`);
    }
    numbers.push(num);
  }
  return numbers.length > 0 ? numbers : defaultArray;
};

export const validateStringLength = (
  value: any,
  name: string,
  maxLength: number,
): string => {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.length > maxLength) {
    throw new Error(`The value of '${name}=' is invalid.`);
  }
  return str;
};

export const validateCustomColorList = (list: any): string => {
  if (list === undefined || list === null || list === "") return "";
  const str = String(list).trim();
  if (!/^(\d+)(,\d+)*$/.test(str)) {
    throw new Error("The value of 'customColorList=' is invalid.");
  }
  return str;
};

export const checkCustomColor = (color: string | ColorMap) => {
  if (typeof color === "object" && color !== null) {
    for (const [key, value] of Object.entries(color)) {
      const numKey = Number(key);
      if (
        !Number.isFinite(numKey) ||
        numKey < 0 ||
        numKey > 100 ||
        !isValidHexColor(String(value))
      ) {
        throw new Error("The value of 'color=' is invalid.");
      }
    }
    return color;
  }

  if (typeof color !== "string") {
    throw new Error("The value of 'color=' is invalid.");
  }

  const trimmed = color.trim();
  if (trimmed.includes(":") || trimmed.split(",").length > 1) {
    const colorMap: ColorMap = {};
    const stops = trimmed.split(",");
    for (const stop of stops) {
      const parts = stop.split(":");
      if (parts.length !== 2) {
        throw new Error("The value of 'color=' is invalid.");
      }
      const [key, value] = parts;
      const numKey = Number(key.trim());
      const hexVal = value.trim().replace(/^#/, "");
      if (
        !Number.isFinite(numKey) ||
        numKey < 0 ||
        numKey > 100 ||
        !isValidHexColor(hexVal)
      ) {
        throw new Error("The value of 'color=' is invalid.");
      }
      colorMap[numKey] = hexVal;
    }
    return colorMap;
  }

  if (isValidHexColor(trimmed)) {
    return normalizeHexColor(trimmed);
  }

  throw new Error("The value of 'color=' is invalid.");
};

