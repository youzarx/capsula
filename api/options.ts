import { getModelTypes } from "../model";
import { COLOR_PRESET_VALUES } from "../model/capabilities";
import { ANIMATION_NAMES } from "../utils/render";

export default (req: any, res: any) => {
  if (typeof res?.setHeader === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    );
  }

  if (req?.method === "OPTIONS") {
    if (typeof res?.status === "function") {
      res.status(204).end();
    } else if (typeof res?.send === "function") {
      res.send("");
    }
    return;
  }

  res.status(200).json({
    types: getModelTypes(),
    animations: ANIMATION_NAMES,
    colorPresets: COLOR_PRESET_VALUES,
  });
};
