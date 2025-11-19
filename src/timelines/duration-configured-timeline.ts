import { Scene } from "../scene";
import { ITimeline } from "./interface";

export interface IAudioDurationGetter{
    get(path: string): Promise<number>;
}

export class DurationConfiguredTimeLine implements ITimeline{
    private durationGetter: IAudioDurationGetter;

    constructor(durationGetter: IAudioDurationGetter){
        this.durationGetter = durationGetter;
    }

    async transform(scenes: Scene[]): Promise<Scene[]> {
        for(let i = 0; i < scenes.length; i++){
            const _path = scenes[i].audioPath;
            scenes[i].duration = await this.durationGetter.get(_path);
        }
        return scenes;
    }
}