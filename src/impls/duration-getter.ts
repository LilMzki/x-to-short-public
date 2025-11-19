import { IAudioDurationGetter } from "../timelines/duration-configured-timeline";
import * as mm from 'music-metadata'

export class DurationGetterImpl implements IAudioDurationGetter{
    async get(path: string): Promise<number> {
        const data = await mm.parseFile(path);
        return data.format.duration ?? 0;
    }
}