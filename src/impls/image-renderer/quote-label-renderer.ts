import { CanvasRenderingContext2D } from 'canvas';

export class QuoteLabelRenderer {
  x: number;
  y: number;
  strokeWeight: number;
  fontSize: number;
  fillColor: string;
  strokeColor: string;
  labelContent: string;

  constructor(labelContent: string) {
    this.x = 50;
    this.y = 1600;
    this.strokeWeight = 4;
    this.fontSize = 40;
    this.fillColor = '#FFFFFF';
    this.strokeColor = '#000000';
    this.labelContent = labelContent;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 描画設定
    ctx.font = `${this.fontSize}px "CustomFont"`
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWeight;

    // stroke → fill の順でテキストを描画
    ctx.strokeText(this.labelContent, this.x, this.y);
    ctx.fillText(this.labelContent, this.x, this.y);

    ctx.restore();
  }
}
