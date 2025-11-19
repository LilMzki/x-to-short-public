import { Scene } from "../scene";
import { ITimeline } from "./interface";

export class QuoteContextTimeline implements ITimeline{
    quoteContext: string;
    constructor(quoteContext: string){
        this.quoteContext = quoteContext;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        const length = scenes.length;
        for(let i = 0; i < length; i++){
            scenes[i].quoteContext = this.quoteContext;
            if(scenes[i].changeAttachedImageNext){
                break;
            }
        }
        return scenes;
    }
}