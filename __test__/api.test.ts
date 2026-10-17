import api from "../api";
import options from "../api/options";

const route = (query: any) => {
  const req = {
    query: {
      type: "wave",
      ...query,
    },
  };
  const res = {
    setHeader: jest.fn(),
    send: jest.fn(),
  };

  return { req, res };
};

describe("Test API", () => {
  it("SVG renders correctly", () => {
    const { req, res } = route({});

    api(req, res);

    expect(res.setHeader).toBeCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalled();

    const svgContent = res.send.mock.lastCall[0];
    expect(svgContent).toContain("<svg");
  });

  it("When an error occurs, the error details are returned", () => {
    const { req, res } = route({
      type: "____",
    });

    api(req, res);

    expect(res.setHeader).toBeCalledWith("Content-Type", "text/html");
    const svgContent = res.send.mock.lastCall[0];
    expect(svgContent).toContain("The value of 'type=' is invalid.");
  });

  it("handles request when type is completely omitted, defaulting to wave", () => {
    const req = {
      query: {},
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    api(req, res);

    expect(res.setHeader).toBeCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalled();
    const svgContent = res.send.mock.lastCall[0];
    expect(svgContent).toContain("<svg");
  });

  it("handles query.type as an array of values safely", () => {
    const req = {
      query: {
        type: ["waving", "egg"],
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    api(req, res);

    expect(res.setHeader).toBeCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalled();
    const svgContent = res.send.mock.lastCall[0];
    expect(svgContent).toContain("<svg");
  });

  it("returns 400 status and error message on invalid type", () => {
    const req = {
      query: {
        type: "nonexistent_model_123",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    api(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.setHeader).toBeCalledWith("Content-Type", "text/html");
    expect(res.send).toHaveBeenCalledWith("The value of 'type=' is invalid.");
  });

  it("returns 400 status on invalid numeric query parameter", () => {
    const req = {
      query: {
        type: "wave",
        height: "not_a_number",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    api(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.setHeader).toBeCalledWith("Content-Type", "text/html");
    expect(res.send).toHaveBeenCalledWith("The value of 'height=' is invalid.");
  });

  it("exposes generator options from the renderer registry", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    options({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        types: expect.arrayContaining(["wave", "waving"]),
        animations: expect.arrayContaining(["fadeIn", "twinkling"]),
        colorPresets: expect.arrayContaining(["gradient", "timeGradient"]),
      }),
    );
  });

  it("sets CORS and Cache-Control headers on successful SVG response", () => {
    const { req, res } = route({});
    api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Methods", "GET, OPTIONS");
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      expect.stringContaining("public, max-age="),
    );
  });

  it("sets CORS and no-cache headers on error response", () => {
    const { req, res } = route({ type: "invalid_type" });
    api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-cache, no-store, must-revalidate",
    );
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/html");
  });

  it("handles OPTIONS preflight method cleanly with 204 status", () => {
    const req = { method: "OPTIONS", query: {} };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      send: jest.fn(),
    };

    api(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it("sets CORS and Cache-Control on /api/options response", () => {
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    options({ method: "GET" }, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      expect.stringContaining("public, max-age="),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
