import * as path from 'path';

export function makePathAbsolute(relativeOrAbsolutePath: string){
    const p = relativeOrAbsolutePath;
    let result: string;
    if(path.isAbsolute(p)){
        result = p;
    }else{
        result = path.resolve(p);
    }

    return result;
}