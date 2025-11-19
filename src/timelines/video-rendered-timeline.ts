import { Scene } from "../scene";
import { ITimeline } from "./interface";
import * as path from "path";
import * as fs from 'fs/promises';

export interface ISceneVideoRenderer{
    render(outPath: string, scene: Scene): Promise<void>;
}

export class VideoRenderedTimeline implements ITimeline{
    constructor(private renderer: ISceneVideoRenderer){}

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            try{
                await fs.mkdir(path.resolve(`out`));
            }catch(e){
                //console.log(e);
            }
            const outPath = path.resolve(`out/rendered-scene-${i}.mp4`);
            await this.renderer.render(outPath, scenes[i]);
            scenes[i].renderedVideoPath = outPath;
            console.log(`${outPath}に動画を出力`);
        }
        return scenes;
    }
}