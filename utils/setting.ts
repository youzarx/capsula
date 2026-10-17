import { isGradientColor } from "../src/verification";
import pallete from "../src/pallete.json";
import gradient from "../src/gradient.json";
import pallete_theme from "../src/pallete_theme.json";

export const generateRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const generateSelectColor = (
  list: any[],
  fontColor: string | undefined,
  customColorList: string,
) => {
  const colorList = customColorList
    .split(",")
    .filter(item => !isNaN(Number(item)))
    .map(item => Number(item))
    .filter(item => 0 <= item && item < list.length);
  const idx = colorList[Math.floor(Math.random() * colorList.length)];
  const auto = list[idx < list.length ? idx : 0];
  return [auto.color, fontColor ? fontColor : auto.text, auto.textBg];
};

export const generateAutoColor = (
  fontColor: string | undefined,
  customColorList = "",
) => {
  if (customColorList !== "")
    return generateSelectColor(pallete, fontColor, customColorList);

  const idx = Math.floor(Math.random() * pallete.length);
  const auto = pallete[idx];
  return [auto.color, fontColor ? fontColor : auto.text, auto.textBg];
};

export const generateAutoGradient = (
  fontColor: string | undefined,
  customColorList = "",
) => {
  if (customColorList !== "")
    return generateSelectColor(gradient, fontColor, customColorList);

  const auto = gradient[Math.floor(Math.random() * gradient.length)];
  return [auto.color, fontColor ? fontColor : auto.text, auto.textBg];
};

export const generateAutoByTime = (queryColor: string, fontColor?: string) => {
  if (queryColor === "timeAuto") return randomizedByTime(pallete, fontColor);
  // else 'timeGradient'
  return randomizedByTime(gradient, fontColor);
};

export const checkThemeColor = (stats: string) => {
  return (pallete_theme as Record<string, any>)[stats];
};

export const generateThemeColor = (stats: string) => {
  const theme = (pallete_theme as Record<string, any>)[stats];
  return [
    theme.color,
    theme.text,
    theme.textBg,
  ];
};

const randomizedByTime = (colorData: any, fontColor?: string) => {
  const buildDate = new Date("Wed Jul 22 2020 17:00:00");
  const nowDate = new Date();
  nowDate.setSeconds(0);
  nowDate.setMilliseconds(0);

  let diffMinute = Math.abs(nowDate.getTime() - buildDate.getTime()) / 60000;
  if (diffMinute >= colorData.length) diffMinute %= colorData.length;

  return [
    colorData[diffMinute].color,
    fontColor ? fontColor : colorData[diffMinute].text,
    colorData[diffMinute].textBg,
  ];
};

export const checkReversal = (reversal: string | boolean) => {
  if (reversal === "true" || reversal === true) {
    return `transform="scale (-1, 1)" transform-origin="center"`;
  }

  return "";
};

export interface GradientCoordinates {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
}

export const calculateGradientCoordinates = (
  angle: number = 0,
): GradientCoordinates => {
  if (!angle || angle === 0 || angle === 360) {
    return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" };
  }
  if (angle === 90) {
    return { x1: "0%", y1: "0%", x2: "0%", y2: "100%" };
  }
  if (angle === 180) {
    return { x1: "100%", y1: "0%", x2: "0%", y2: "0%" };
  }
  if (angle === 270) {
    return { x1: "0%", y1: "100%", x2: "0%", y2: "0%" };
  }

  const rad = (angle * Math.PI) / 180;
  const x1 = Math.round((50 - 50 * Math.cos(rad)) * 100) / 100;
  const y1 = Math.round((50 - 50 * Math.sin(rad)) * 100) / 100;
  const x2 = Math.round((50 + 50 * Math.cos(rad)) * 100) / 100;
  const y2 = Math.round((50 + 50 * Math.sin(rad)) * 100) / 100;

  return {
    x1: `${x1}%`,
    y1: `${y1}%`,
    x2: `${x2}%`,
    y2: `${y2}%`,
  };
};

