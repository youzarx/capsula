import api from "../api";
import { DOMParser } from "xmldom";
import Wave from "../model/normalModel/wave";
import Models from "../model";

const route = (query: any) => {
  const req = {
    query,
  };
  const res = {
    setHeader: jest.fn(),
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };

  return { req, res };
};

describe("Security & Correctness Regression Suite", () => {
  describe("Wave Model Determinism & State Mutation", () => {
    it("calling path() and render() repeatedly does not mutate this.height", () => {
      const wave = new Wave({
        height: 300,
        text: "Wave Determinism",
      });

      expect(wave.height).toBe(300);

      const path1 = wave.path();
      expect(wave.height).toBe(300);

      const path2 = wave.path();
      expect(wave.height).toBe(300);
      expect(path1).toBe(path2);

      const render1 = wave.render();
      expect(wave.height).toBe(300);

      const render2 = wave.render();
      expect(wave.height).toBe(300);
      expect(render1).toBe(render2);

      // Verify that coordinates correspond to baseHeight = 300 - 120 = 180
      expect(path1).toContain("T 0 250"); // 70 + 180 = 250
      expect(path1).toContain("Q 110 125"); // -55 + 180 = 125
    });
  });

  describe("XML/SVG Escaping & Injection Prevention", () => {
    it("safely escapes XML special characters in text and desc", () => {
      const hostileText = `<script>alert(1)</script>`;
      const hostileDesc = `</text><script>alert("pwned")</script>`;

      const { req, res } = route({
        type: "wave",
        text: hostileText,
        desc: hostileDesc,
      });

      api(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
      const svgContent = res.send.mock.lastCall[0];

      // Must parse as valid XML without syntax errors
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, "image/svg+xml");
      expect(doc.documentElement.tagName).toBe("svg");

      // Verify NO script elements were created
      const scripts = doc.getElementsByTagName("script");
      expect(scripts.length).toBe(0);

      // Text node values match literal input characters
      const texts = doc.getElementsByTagName("text");
      expect(texts.length).toBe(2);
      expect(texts[0].firstChild.data).toBe(hostileText);
      expect(texts[1].firstChild.data).toBe(hostileDesc);
    });

    it("correctly handles 'Tom & Jerry' and quoted strings without double escaping", () => {
      const ampText = "Tom & Jerry";
      const quotedDesc = `"quoted" and 'single'`;

      const { req, res } = route({
        type: "rect",
        text: ampText,
        desc: quotedDesc,
      });

      api(req, res);

      const svgContent = res.send.mock.lastCall[0];
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, "image/svg+xml");

      const texts = doc.getElementsByTagName("text");
      expect(texts[0].firstChild.data).toBe(ampText);
      expect(texts[1].firstChild.data).toBe(quotedDesc);

      // Verify already-escaped entity is not double-escaped
      const { req: req2, res: res2 } = route({
        type: "rect",
        text: "Tom &amp; Jerry",
      });
      api(req2, res2);
      const svgContent2 = res2.send.mock.lastCall[0];
      expect(svgContent2).not.toContain("&amp;amp;");
    });

    it("preserves Arabic text, emojis, and multiline text", () => {
      const arabicText = "مرحبا بالعالم";
      const emojiText = "🚀 Rocket 🌈 Rainbow";

      const { req, res } = route({
        type: "slice",
        text: `${arabicText}-nl-${emojiText}`,
      });

      api(req, res);

      const svgContent = res.send.mock.lastCall[0];
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, "image/svg+xml");

      const tspans = doc.getElementsByTagName("tspan");
      expect(tspans.length).toBe(2);
      expect(tspans[0].firstChild.data).toBe(arabicText);
      expect(tspans[1].firstChild.data).toBe(emojiText);
    });
  });

  describe("Parameter Bounds and Input Validation", () => {
    it("rejects negative, zero, and extreme height values", () => {
      const invalidHeights = ["-10", "0", "999999", "NaN", "Infinity"];
      for (const h of invalidHeights) {
        const { req, res } = route({ type: "wave", height: h });
        api(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("The value of 'height=' is invalid.");
      }
    });

    it("rejects extreme fontSize and descSize", () => {
      const { req: r1, res: s1 } = route({ type: "wave", fontSize: 0 });
      api(r1, s1);
      expect(s1.status).toHaveBeenCalledWith(400);
      expect(s1.send).toHaveBeenCalledWith("The value of 'fontSize=' is invalid.");

      const { req: r2, res: s2 } = route({ type: "wave", fontSize: 1000 });
      api(r2, s2);
      expect(s2.status).toHaveBeenCalledWith(400);

      const { req: r3, res: s3 } = route({ type: "wave", descSize: 500 });
      api(r3, s3);
      expect(s3.status).toHaveBeenCalledWith(400);
    });

    it("rejects extreme rotate values outside [-360, 360]", () => {
      const { req, res } = route({ type: "wave", rotate: 720 });
      api(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("The value of 'rotate=' is invalid.");
    });

    it("rejects malformed fontAlign arrays and values", () => {
      const { req, res } = route({ type: "wave", fontAlign: "10,abc" });
      api(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("The value of 'fontAlign=' is invalid.");
    });

    it("rejects excessively long text strings", () => {
      const massiveText = "A".repeat(1001);
      const { req, res } = route({ type: "wave", text: massiveText });
      api(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("The value of 'text=' is invalid.");
    });

    it("rejects malicious or malformed fontFamily strings", () => {
      const maliciousFonts = [
        "Arial; } </style><script>alert(1)</script>",
        "font<script>",
        "font{color:red}",
        "font;background:url('evil')",
      ];

      for (const font of maliciousFonts) {
        const { req, res } = route({ type: "wave", fontFamily: font });
        api(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("The value of 'fontFamily=' is invalid.");
      }
    });

    it("rejects malicious or invalid colors, strokes, and gradients", () => {
      const { req: r1, res: s1 } = route({ type: "wave", stroke: '"><script>' });
      api(r1, s1);
      expect(s1.status).toHaveBeenCalledWith(400);
      expect(s1.send).toHaveBeenCalledWith("The value of 'stroke=' is invalid.");

      const { req: r2, res: s2 } = route({ type: "wave", color: "0:<script>,100:fff" });
      api(r2, s2);
      expect(s2.status).toHaveBeenCalledWith(400);
      expect(s2.send).toHaveBeenCalledWith("The value of 'color=' is invalid.");

      const { req: r3, res: s3 } = route({ type: "wave", fontColor: "invalidHexColor" });
      api(r3, s3);
      expect(s3.status).toHaveBeenCalledWith(400);
      expect(s3.send).toHaveBeenCalledWith("The value of 'fontColor=' is invalid.");
    });

    it("rejects invalid section, animation, and theme values", () => {
      const { req: r1, res: s1 } = route({ type: "wave", section: "sidebar" });
      api(r1, s1);
      expect(s1.status).toHaveBeenCalledWith(400);
      expect(s1.send).toHaveBeenCalledWith("The value of 'section=' is invalid.");

      const { req: r2, res: s2 } = route({ type: "wave", animation: "bounceInfinite" });
      api(r2, s2);
      expect(s2.status).toHaveBeenCalledWith(400);
      expect(s2.send).toHaveBeenCalledWith("The value of 'animation=' is invalid.");

      const { req: r3, res: s3 } = route({ type: "wave", theme: "nonexistent_theme" });
      api(r3, s3);
      expect(s3.status).toHaveBeenCalledWith(400);
      expect(s3.send).toHaveBeenCalledWith("The value of 'theme=' is invalid.");
    });

    it("rejects negative, zero, and out-of-bound width values", () => {
      const invalidWidths = ["-10", "0", "199", "2501", "999999", "NaN", "Infinity", "wide"];
      for (const w of invalidWidths) {
        const { req, res } = route({ type: "wave", width: w });
        api(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("The value of 'width=' is invalid.");
      }
    });

    it("accepts valid width and defaults correctly when omitted", () => {
      // Omitted width defaults to 854
      const { req: rDefault, res: sDefault } = route({ type: "wave" });
      api(rDefault, sDefault);
      const svgDefault = sDefault.send.mock.lastCall[0];
      const parser = new DOMParser();
      const docDefault = parser.parseFromString(svgDefault, "image/svg+xml");
      expect(docDefault.documentElement.getAttribute("width")).toBe("854");
      expect(docDefault.documentElement.getAttribute("viewBox")).toContain("0 0 854");

      // Custom valid width within bounds [200, 2500]
      const { req: rCustom, res: sCustom } = route({ type: "rect", width: 1200 });
      api(rCustom, sCustom);
      const svgCustom = sCustom.send.mock.lastCall[0];
      const docCustom = parser.parseFromString(svgCustom, "image/svg+xml");
      expect(docCustom.documentElement.getAttribute("width")).toBe("1200");
      expect(docCustom.documentElement.getAttribute("viewBox")).toContain("0 0 1200");
    });

    it("enforces integer-width rounding policy on decimal input", () => {
      const parser = new DOMParser();

      // 1200.4 should round to 1200
      const { req: r1, res: s1 } = route({ type: "wave", width: "1200.4", height: 200 });
      api(r1, s1);
      const svg1 = s1.send.mock.lastCall[0];
      const doc1 = parser.parseFromString(svg1, "image/svg+xml");
      expect(doc1.documentElement.getAttribute("width")).toBe("1200");
      expect(doc1.documentElement.getAttribute("viewBox")).toBe("0 0 1200 200");

      // 1200.6 should round to 1201
      const { req: r2, res: s2 } = route({ type: "wave", width: "1200.6", height: 200 });
      api(r2, s2);
      const svg2 = s2.send.mock.lastCall[0];
      const doc2 = parser.parseFromString(svg2, "image/svg+xml");
      expect(doc2.documentElement.getAttribute("width")).toBe("1201");
      expect(doc2.documentElement.getAttribute("viewBox")).toBe("0 0 1201 200");
    });

    it("rejects invalid gradientAngle values outside [0, 360]", () => {
      const invalidAngles = ["-1", "-90", "361", "720", "NaN", "Infinity", "angle"];
      for (const a of invalidAngles) {
        const { req, res } = route({ type: "wave", color: "gradient", gradientAngle: a });
        api(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("The value of 'gradientAngle=' is invalid.");
      }
    });

    it("correctly applies cardinal gradient angles and preserves legacy default", () => {
      const parser = new DOMParser();

      // Omitted angle defaults to 0 and produces legacy coordinates
      const { req: rDef, res: sDef } = route({ type: "wave", color: "gradient" });
      api(rDef, sDef);
      const svgDef = sDef.send.mock.lastCall[0];
      const docDef = parser.parseFromString(svgDef, "image/svg+xml");
      const gradDef = docDef.getElementsByTagName("linearGradient")[0] || docDef.getElementsByTagName("lineargradient")[0];
      expect(gradDef.getAttribute("x1")).toBe("0%");
      expect(gradDef.getAttribute("y1")).toBe("0%");
      expect(gradDef.getAttribute("x2")).toBe("100%");
      expect(gradDef.getAttribute("y2")).toBe("0%");

      // 90 degrees
      const { req: r90, res: s90 } = route({ type: "wave", color: "gradient", gradientAngle: 90 });
      api(r90, s90);
      const svg90 = s90.send.mock.lastCall[0];
      const doc90 = parser.parseFromString(svg90, "image/svg+xml");
      const grad90 = doc90.getElementsByTagName("linearGradient")[0] || doc90.getElementsByTagName("lineargradient")[0];
      expect(grad90.getAttribute("x1")).toBe("0%");
      expect(grad90.getAttribute("y1")).toBe("0%");
      expect(grad90.getAttribute("x2")).toBe("0%");
      expect(grad90.getAttribute("y2")).toBe("100%");

      // 180 degrees
      const { req: r180, res: s180 } = route({ type: "wave", color: "gradient", gradientAngle: 180 });
      api(r180, s180);
      const svg180 = s180.send.mock.lastCall[0];
      const doc180 = parser.parseFromString(svg180, "image/svg+xml");
      const grad180 = doc180.getElementsByTagName("linearGradient")[0] || doc180.getElementsByTagName("lineargradient")[0];
      expect(grad180.getAttribute("x1")).toBe("100%");
      expect(grad180.getAttribute("y1")).toBe("0%");
      expect(grad180.getAttribute("x2")).toBe("0%");
      expect(grad180.getAttribute("y2")).toBe("0%");

      // 270 degrees
      const { req: r270, res: s270 } = route({ type: "wave", color: "gradient", gradientAngle: 270 });
      api(r270, s270);
      const svg270 = s270.send.mock.lastCall[0];
      const doc270 = parser.parseFromString(svg270, "image/svg+xml");
      const grad270 = doc270.getElementsByTagName("linearGradient")[0] || doc270.getElementsByTagName("lineargradient")[0];
      expect(grad270.getAttribute("x1")).toBe("0%");
      expect(grad270.getAttribute("y1")).toBe("100%");
      expect(grad270.getAttribute("x2")).toBe("0%");
      expect(grad270.getAttribute("y2")).toBe("0%");

      // 360 degrees
      const { req: r360, res: s360 } = route({ type: "wave", color: "gradient", gradientAngle: 360 });
      api(r360, s360);
      const svg360 = s360.send.mock.lastCall[0];
      const doc360 = parser.parseFromString(svg360, "image/svg+xml");
      const grad360 = doc360.getElementsByTagName("linearGradient")[0] || doc360.getElementsByTagName("lineargradient")[0];
      expect(grad360.getAttribute("x1")).toBe("0%");
      expect(grad360.getAttribute("y1")).toBe("0%");
      expect(grad360.getAttribute("x2")).toBe("100%");
      expect(grad360.getAttribute("y2")).toBe("0%");
    });

    it("accepts all 6 newly added themes and renders them properly", () => {
      const newThemes = [
        "catppuccin-mocha",
        "catppuccin-latte",
        "github-dark",
        "tokyonight-storm",
        "nord-dark",
        "synthwave84",
      ];

      for (const theme of newThemes) {
        const { req, res } = route({ type: "wave", theme, text: "Theme Test" });
        api(req, res);
        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
        const svg = res.send.mock.lastCall[0];
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");
        expect(doc.documentElement.tagName).toBe("svg");
      }
    });
  });

  describe("New Models: Diagonal, Curve, Dots", () => {
    const newModels = ["diagonal", "curve", "dots"];

    it("renders valid SVG without parser errors for all new models", () => {
      const parser = new DOMParser();
      for (const type of newModels) {
        const { req, res } = route({
          type,
          width: 1000,
          height: 350,
          text: `${type} title`,
          desc: `${type} description`,
        });
        api(req, res);

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
        const svgContent = res.send.mock.lastCall[0];
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        expect(doc.documentElement.tagName).toBe("svg");
        expect(doc.documentElement.getAttribute("width")).toBe("1000");
        expect(doc.documentElement.getAttribute("height")).toBe("350");
        expect(doc.documentElement.getAttribute("viewBox")).toBe("0 0 1000 350");

        const texts = doc.getElementsByTagName("text");
        expect(texts.length).toBeGreaterThan(0);
      }
    });

    it("safely escapes hostile XML payloads in new models", () => {
      const hostilePayload = `<script>alert("evil")</script>`;
      const parser = new DOMParser();

      for (const type of newModels) {
        const { req, res } = route({
          type,
          text: hostilePayload,
          desc: hostilePayload,
        });
        api(req, res);

        const svgContent = res.send.mock.lastCall[0];
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        expect(doc.documentElement.tagName).toBe("svg");

        const scripts = doc.getElementsByTagName("script");
        expect(scripts.length).toBe(0);

        const texts = doc.getElementsByTagName("text");
        expect(texts[0].firstChild.data).toBe(hostilePayload);
        expect(texts[1].firstChild.data).toBe(hostilePayload);
      }
    });

    it("correctly round-trips 'Tom & Jerry' without double-escaping in new models", () => {
      const parser = new DOMParser();

      for (const type of newModels) {
        const { req, res } = route({
          type,
          text: "Tom & Jerry",
        });
        api(req, res);

        const svgContent = res.send.mock.lastCall[0];
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        const texts = doc.getElementsByTagName("text");
        expect(texts[0].firstChild.data).toBe("Tom & Jerry");
      }
    });

    it("dots model creates an SVG pattern element in defs", () => {
      const { req, res } = route({ type: "dots" });
      api(req, res);

      const svgContent = res.send.mock.lastCall[0];
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, "image/svg+xml");

      const patterns = doc.getElementsByTagName("pattern");
      expect(patterns.length).toBe(1);
      expect(patterns[0].getAttribute("id")).toBe("dot-grid");
    });
  });

  describe("Performance Benchmark Signal", () => {
    it("renders 50 varied requests within acceptable latency ceiling", () => {
      const testTypes = ["wave", "rect", "diagonal", "curve", "dots", "slice", "cylinder"];
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        const type = testTypes[i % testTypes.length];
        const { req, res } = route({
          type,
          width: 800 + i * 10,
          height: 200 + i * 2,
          gradientAngle: (i * 30) % 360,
          text: `Bench ${i}`,
        });
        api(req, res);
        expect(res.send).toHaveBeenCalled();
      }

      const elapsedMs = performance.now() - start;
      // Diagnostic signal: 50 in-memory SVG renders typically finish in under 100ms; generous ceiling 2000ms
      expect(elapsedMs).toBeLessThan(2000);
    });
  });
});

