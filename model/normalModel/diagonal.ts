import NormalModel from "./normalModel";

class Diagonal extends NormalModel {
  path() {
    const cutY = Math.round(this.height * 0.45);
    return `M 0 0 L ${this.width} 0 L ${this.width} ${cutY} L 0 ${this.height} Z`;
  }

  content() {
    return `<path fill="${this.color}" ${this.reversal} fill-opacity="1" d="${this.path()}"></path>`;
  }
}

export default Diagonal;
