import NormalModel from "./normalModel";

class Curve extends NormalModel {
  path() {
    const startY = Math.round(this.height * 0.7);
    const midX = Math.round(this.width * 0.5);
    const endY = Math.round(this.height * 0.35);
    return `M 0 0 L 0 ${startY} Q ${midX} ${this.height} ${this.width} ${endY} L ${this.width} 0 Z`;
  }

  content() {
    return `<path fill="${this.color}" ${this.reversal} fill-opacity="1" d="${this.path()}"></path>`;
  }
}

export default Curve;
