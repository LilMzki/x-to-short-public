import { Scene } from "../scene";
import { ITimeline } from "./interface";

export class AttachedImageTimeline implements ITimeline{
    imgPaths: string[];
    constructor(imgPaths: string[]){
        this.imgPaths = imgPaths;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        let imageChangedCount = 0;
        for(let i = 0; i < scenes.length; i++){
            const imageSelector = imageChangedCount % this.imgPaths.length;
            scenes[i].attachedImagePath = this.imgPaths[imageSelector];
            if(scenes[i].changeAttachedImageNext){
                imageChangedCount++;
            }
        }
        return scenes;
    }
}