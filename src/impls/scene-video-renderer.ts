import { Scene } from "../scene";
import { ISceneVideoRenderer } from "../timelines/video-rendered-timeline";
import { exec } from 'child_process';
import * as path from 'path';
import { makePathAbsolute } from "../utils/make-path-absolute";

export class SceneVideoRenderer implements ISceneVideoRenderer {

    async render(outPath: string, scene: Scene): Promise<void> {
        const out = makePathAbsolute(outPath);
        const png = makePathAbsolute(scene.renderedImagePath);
        const audio = makePathAbsolute(scene.audioPath);

        const cmd = [
            'ffmpeg',
            '-y',
            '-loop 1',
            `-i "${png}"`,
            `-i "${audio}"`,
            `-c:v libx264`,
            `-t ${scene.duration}`,
            '-pix_fmt yuv420p',
            `"${out}"`
            ].join(' ');

        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(stderr);
                    reject(error);  // ← ここでエラーを返す
                    return;
                }
                resolve(); // ← 完了したら resolve
            });
        });
    }
}
