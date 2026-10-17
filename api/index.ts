import Models from "../model";
import { regexData } from "../src/verification";

export default (req: any, res: any) => {
  try {
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

    res.setHeader("Content-Type", "image/svg+xml");
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
    res.setHeader("Content-Type", "text/html");
    const message =
      status === 500
        ? "Internal Server Error"
        : err?.message || "Invalid Request";
    res.send(message);
  }
};

