import { CanvasRenderingContext2D } from "canvas";

export class CaptionTextRenderer {
  private centerX = 540;
  private startY = 180;
  private maxWidth = 900;

  private letterSpacing = 0;
  private lineSpacing = 80;
  private sectionSpacing = 850;
  private fontSize = 78;

  constructor() {}

  render(ctx: CanvasRenderingContext2D, content: string) {
    ctx.font = `${this.fontSize}px "CustomFont"`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";

    const lines = this.createLinesWithNewlines(ctx, content);
    this.drawLines(ctx, lines);
  }

  private createLinesWithNewlines(ctx: CanvasRenderingContext2D, content: string): string[] {
    const rawBlocks = content.split("\n");
    return rawBlocks;
  }

  private drawLines(ctx: CanvasRenderingContext2D, lines: string[]) {
    let currentY = this.startY;

    lines.forEach((line, i) => {
      if (i === 3) {
        currentY += this.sectionSpacing;
      }

      this.drawLine(ctx, line, currentY);
      currentY += this.lineSpacing;
    });
  }

  /** 実測幅を使ってセンタリング & 描画 */
  private drawLine(ctx: CanvasRenderingContext2D, line: string, y: number) {
    const lineWidth = this.getLineWidth(ctx, line);
    const startX = this.centerX - lineWidth / 2;

    ctx.save();

    let x = startX;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      ctx.fillText(ch, x, y);

      const w = ctx.measureText(ch).width;
      x += w + this.letterSpacing;
    }

    ctx.restore();
  }

  /** 実際の幅 + letterSpacing を加味した幅計算 */
  private getLineWidth(ctx: CanvasRenderingContext2D, line: string): number {
    if (line.length === 0) return 0;

    let width = 0;

    for (const ch of line) {
      width += ctx.measureText(ch).width + this.letterSpacing;
    }

    return width - this.letterSpacing; // 最後の文字はスペース不要
  }
}
