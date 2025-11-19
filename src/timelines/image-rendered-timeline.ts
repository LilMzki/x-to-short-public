import { Scene } from "../scene";
import { ITimeline } from "./interface";
import * as path from "path";
import * as fs from "fs/promises";

export interface ISceneImageRenderer{
    render(outPath: string, scene: Scene): Promise<void>;
}

export class ImageRenderedTimeline implements ITimeline{
    constructor(private renderer: ISceneImageRenderer){}

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            try{
                await fs.mkdir(path.resolve(`out`));
            }catch(e){
                //console.log(e);
            }
            
            const outPath = path.resolve(`out/rendered-scene-${i}.png`);
            await this.renderer.render(outPath, scenes[i]);
            scenes[i].renderedImagePath = outPath;
        }
        return scenes;
    }
}