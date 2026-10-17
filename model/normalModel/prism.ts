import NormalModel from "./normalModel";

class Prism extends NormalModel {
  path() {
    const w = this.width;
    const h = this.height;
    const cut = Math.min(36, Math.round(h * 0.25));
    return `M 0 0 L ${w} 0 L ${w} ${h - cut} L ${w - cut} ${h} L ${cut} ${h} L 0 ${h - cut} Z`;
  }

  content() {
    const w = this.width;
    const h = this.height;
    const cut = Math.min(36, Math.round(h * 0.25));
    const innerPath = `M 6 6 L ${w - 6} 6 L ${w - 6} ${h - cut - 2} L ${w - cut - 2} ${h - 6} L ${cut + 2} ${h - 6} L 6 ${h - cut - 2} Z`;
    const bottomAccent = `M ${cut + 12} ${h - 10} L ${w - cut - 12} ${h - 10}`;

    return `
      <path fill="${this.color}" ${this.reversal} fill-opacity="0.95" d="${this.path()}" />
      <path fill="none" stroke="${this.color}" stroke-opacity="0.3" stroke-width="1.5" d="${innerPath}" />
      <path fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round" d="${bottomAccent}" />
      <polygon points="${cut},${h} ${cut + 8},${h - 8} ${cut},${h - 8}" fill="${this.color}" opacity="0.6" />
      <polygon points="${w - cut},${h} ${w - cut - 8},${h - 8} ${w - cut},${h - 8}" fill="${this.color}" opacity="0.6" />
    `;
  }
}

export default Prism;
