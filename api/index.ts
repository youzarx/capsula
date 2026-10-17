import Models from "../model";
import { regexData } from "../src/verification";

export default (req: any, res: any) => {
  try {
    if (typeof res?.setHeader === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    if (req?.method === "OPTIONS") {
      if (typeof res?.status === "function") {
        res.status(204).end();
      } else if (typeof res?.send === "function") {
        res.send("");
      }
      return;
    }

    const rawType = Array.isArray(req?.query?.type)
      ? req.query.type[0]
      : req?.query?.type;

    const isTypeProvided =
      rawType !== undefined &&
      rawType !== null &&
      String(rawType).trim() !== "";

    const type = isTypeProvided ? regexData(rawType) : "wave";

    if (!type || !Models[type]) {
      const err: any = new Error("The value of 'type=' is invalid.");
      err.statusCode = 400;
      throw err;
    }

    const query = req?.query ? { ...req.query, type } : { type };
    const model = new Models[type](query);
    const svg = model.render();

    if (typeof res?.setHeader === "function") {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader(
        "Cache-Control",
        "public, max-age=7200, s-maxage=86400, stale-while-revalidate=604800",
      );
    }
    res.send(svg);
  } catch (err: any) {
    const status =
      err?.statusCode ||
      (typeof err?.message === "string" &&
      err.message.startsWith("The value of ")
        ? 400
        : 500);

    if (typeof res?.status === "function") {
      res.status(status);
    }
    if (typeof res?.setHeader === "function") {
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    const message =
      status === 500
        ? "Internal Server Error"
        : err?.message || "Invalid Request";
    res.send(message);
  }
};

