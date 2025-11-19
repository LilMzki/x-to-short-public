import { Scene } from "../scene";
import { ITimeline } from "./interface";

export class SceneBuilder{
    private timelines: ITimeline[] = [];

    public add(timeline: ITimeline): SceneBuilder{
        this.timelines.push(timeline);
        return this;
    }

    async execute(): Promise<Scene[]>{
        let scenes: Scene[] = [];
        for(let i = 0; i < this.timelines.length; i++){
            scenes = await this.timelines[i].transform(scenes);
        }
        return scenes;
    }
}