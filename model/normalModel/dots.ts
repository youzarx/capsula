import NormalModel from "./normalModel";

class Dots extends NormalModel {
  path() {
    return `M 0 0 L ${this.width} 0 L ${this.width} ${this.height} L 0 ${this.height} Z`;
  }

  content() {
    return `
      <defs>
        <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="${this.color}" opacity="0.8" />
        </pattern>
      </defs>
      <rect width="${this.width}" height="${this.height}" fill="${this.color}" fill-opacity="0.08" ${this.reversal} />
      <rect width="${this.width}" height="${this.height}" fill="url(#dot-grid)" ${this.reversal} />
    `;
  }
}

export default Dots;
