// ./src/impls/image-renderer/scene-image-renderer.ts
import { Scene } from "../../scene";
import { ISceneImageRenderer } from "../../timelines/image-rendered-timeline";
import { createCanvas, registerFont } from "canvas";
import * as fs from "fs/promises";
import * as path from "path";
import { makePathAbsolute } from "../../utils/make-path-absolute";
import { CaptionTextRenderer } from "./caption-text-renderer";
import { AttachedImageRenderer } from "./attached-image-renderer";
import { QuoteLabelRenderer } from "./quote-label-renderer";
import { loadConfig } from "../../utils/config";

export class SceneImageRenderer implements ISceneImageRenderer {
  async render(outPath: string, scene: Scene): Promise<void> {
    const canvas = createCanvas(1080, 1920);
    const ctx = canvas.getContext("2d");

    const config = loadConfig();
    const fontPath = path.resolve(config.fontPath);

    registerFont(fontPath, {
      family: "CustomFont",
    });

    // 背景
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1080, 1920);

    // 画像
    const imgRenderer = new AttachedImageRenderer(makePathAbsolute(scene.attachedImagePath));
    await imgRenderer.preload();
    imgRenderer.render(ctx);

    // テキスト
    const textRenderer = new CaptionTextRenderer();
    textRenderer.render(ctx, scene.captionContext);

    const quoteLabelRenderer = new QuoteLabelRenderer(scene.quoteContext);
    quoteLabelRenderer.render(ctx);

    await fs.writeFile(outPath, canvas.toBuffer("image/png"));
  }
}
