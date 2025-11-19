import { Scene } from "../scene";

export interface ITimeline {
    transform( scenes: Scene[] ): Promise<Scene[]>
}