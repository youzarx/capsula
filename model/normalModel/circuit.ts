import NormalModel from "./normalModel";

class Circuit extends NormalModel {
  path() {
    return `M 0 0 L ${this.width} 0 L ${this.width} ${this.height} L 0 ${this.height} Z`;
  }

  content() {
    const w = this.width;
    const h = this.height;

    // Corner circuit trace 1 (top-left)
    const t1 = `M 20 20 L 90 20 L 130 60 L 220 60`;
    // Corner circuit trace 2 (bottom-left)
    const t2 = `M 20 ${h - 20} L 80 ${h - 20} L 120 ${h - 60} L 240 ${h - 60}`;
    // Corner circuit trace 3 (top-right)
    const t3 = `M ${w - 20} 20 L ${w - 90} 20 L ${w - 130} 60 L ${w - 220} 60`;
    // Corner circuit trace 4 (bottom-right)
    const t4 = `M ${w - 20} ${h - 20} L ${w - 80} ${h - 20} L ${w - 120} ${h - 60} L ${w - 240} ${h - 60}`;
    // Bottom border circuit rail
    const rail = `M 40 ${h - 10} L ${w - 40} ${h - 10}`;

    return `
      <rect width="${w}" height="${h}" rx="12" ry="12" fill="${this.color}" fill-opacity="0.08" ${this.reversal} />
      <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="10" ry="10" fill="none" stroke="${this.color}" stroke-width="1" stroke-opacity="0.25" />
      <g fill="none" stroke="${this.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.6">
        <path d="${t1}" />
        <path d="${t2}" />
        <path d="${t3}" />
        <path d="${t4}" />
        <path d="${rail}" stroke-dasharray="16, 8" />
      </g>
      <g fill="${this.color}" opacity="0.85">
        <circle cx="220" cy="60" r="3.5" />
        <circle cx="240" cy="${h - 60}" r="3.5" />
        <circle cx="${w - 220}" cy="60" r="3.5" />
        <circle cx="${w - 240}" cy="${h - 60}" r="3.5" />
        <circle cx="90" cy="20" r="2.5" />
        <circle cx="${w - 90}" cy="20" r="2.5" />
      </g>
    `;
  }
}

export default Circuit;
