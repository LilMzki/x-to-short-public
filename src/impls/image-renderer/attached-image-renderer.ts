import {loadImage, CanvasRenderingContext2D} from 'canvas';

export class AttachedImageRenderer {
  private x = 1080 / 2;
  private y = 850;
  private maxW = 800;
  private maxH = 700;

  private imagePath: string;
  private imageObj: any = null;

  constructor(imagePath: string) {
    this.imagePath = imagePath;
  }

  async preload() {
    this.imageObj = await loadImage(this.imagePath);
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.imageObj) return;

    const img = this.imageObj;
    const w = img.width;
    const h = img.height;

    let scaleRatio = 1;

    if (w > h) {
      scaleRatio = this.maxW / w;
    } else {
      scaleRatio = this.maxH / h;
    }

    const newW = w * scaleRatio;
    const newH = h * scaleRatio;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.drawImage(img, -newW / 2, -newH / 2, newW, newH);
    ctx.restore();
  }
}
