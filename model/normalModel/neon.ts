import NormalModel from "./normalModel";

class Neon extends NormalModel {
  path() {
    return `M 0 0 L ${this.width} 0 L ${this.width} ${this.height} L 0 ${this.height} Z`;
  }

  content() {
    const w = this.width;
    const h = this.height;
    const horizon = Math.round(h * 0.55);

    // Dynamic perspective lines converging towards horizon
    const vLines = [1, 2, 3, 4, 6, 7, 8, 9]
      .map(i => {
        const xBottom = Math.round((w * i) / 10);
        const xHorizon = Math.round(w * 0.5 + (xBottom - w * 0.5) * 0.25);
        return `<line x1="${xHorizon}" y1="${horizon}" x2="${xBottom}" y2="${h}" stroke="${this.color}" stroke-opacity="0.22" stroke-width="1.2" />`;
      })
      .join("");

    // Horizontal receding lines
    const h1 = Math.round(horizon + (h - horizon) * 0.2);
    const h2 = Math.round(horizon + (h - horizon) * 0.5);
    const h3 = Math.round(horizon + (h - horizon) * 0.82);

    return `
      <defs>
        <linearGradient id="neon-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${this.color}" stop-opacity="0.04" />
          <stop offset="60%" stop-color="${this.color}" stop-opacity="0.12" />
          <stop offset="100%" stop-color="${this.color}" stop-opacity="0.28" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="${this.color}" fill-opacity="0.06" ${this.reversal} />
      <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#neon-fade)" />
      ${vLines}
      <line x1="0" y1="${h1}" x2="${w}" y2="${h1}" stroke="${this.color}" stroke-opacity="0.2" stroke-width="1" />
      <line x1="0" y1="${h2}" x2="${w}" y2="${h2}" stroke="${this.color}" stroke-opacity="0.28" stroke-width="1.2" />
      <line x1="0" y1="${h3}" x2="${w}" y2="${h3}" stroke="${this.color}" stroke-opacity="0.4" stroke-width="1.5" />
      <line x1="0" y1="${horizon}" x2="${w}" y2="${horizon}" stroke="${this.color}" stroke-opacity="0.8" stroke-width="2" />
      <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="${this.color}" stroke-opacity="0.9" stroke-width="3" />
    `;
  }
}

export default Neon;
