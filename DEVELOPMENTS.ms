# x-to-short 開発者向けガイド

このドキュメントは、**自分でこのツールをアレンジしたい人向け**です。

* 「字幕の出し方を変えたい」
* 「別の TTS エンジンに差し替えたい」
* 「シーンの構成ロジックを自分好みにしたい」

といった改造をしやすくするために、コードの設計と拡張方法をまとめています。

---

## 全体アーキテクチャのざっくりしたイメージ

このツールは、

1. **Scene というドメインモデル**
2. **Scene を順番に変換していく ITimeline**
3. **レンダリングや音声生成などの副作用は実装層（impls）が担当**
4. その結果（ファイルパスなど）を **Scene に書き戻す**

という **パイプライン構造** になっています。

流れをざっくり書くと：

1. GPT からスクリプトを取得（`get-script-from-gpt.ts`）
2. `SceneBuilder` にいくつかの `ITimeline` を登録
3. 各 `ITimeline` が `Scene[]` を順番に変換していく
4. 最終的に、1 シーンごとの動画を FFmpeg で作る
5. 複数シーンの動画を結合し、BGM を足して完成

---

## Scene ドメインモデル

`src/scene.ts`

```ts
export class Scene{
    speakContext: string = "";
    captionContext: string = "";
    duration: number = 0;
    attachedImagePath: string = "";
    audioPath: string = "";
    changeAttachedImageNext: boolean = false;
    renderedImagePath: string = "";
    renderedVideoPath: string = "";
    quoteContext: string = "";
}
```

**Scene は「1 カット（1 シーン）」の情報を全部持つ入れ物**です。

* `speakContext` …… ナレーションの元になるテキスト（^ で改行情報が入る）
* `captionContext` …… 画面に表示する字幕テキスト
* `duration` …… そのシーンの長さ（秒数）
* `attachedImagePath` …… そのシーンで使う元画像
* `audioPath` …… 合成された音声ファイル（wav）のパス
* `changeAttachedImageNext` …… true のとき、次のシーンから画像を切り替える
* `renderedImagePath` …… 字幕などを乗せた 1 シーン分の PNG
* `renderedVideoPath` …… そのシーン単体の MP4 動画
* `quoteContext` …… 投稿の引用テキストなど、ラベル用のテキスト

**基本方針**は：

> 「シーンに関する状態は可能な限り Scene に集約する」

というものです。
タイムラインやレンダラーは、この Scene を読んだり書いたりしながら進みます。

---

## ITimeline と SceneBuilder（パイプラインの中身）

### ITimeline インターフェイス

`src/timelines/interface.ts`

```ts
import { Scene } from "../scene";

export interface ITimeline {
    transform( scenes: Scene[] ): Promise<Scene[]>
}
```

* `transform` は **Scene[] を受け取り、更新した Scene[] を返す非同期関数**です。
* 1 個の `ITimeline` が「パイプラインの1段階」を表します。

### SceneBuilder

`src/timelines/builder.ts`

```ts
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
```

* `add()` で `ITimeline` を順番に登録
* `execute()` が、登録された順番に `transform` を流していきます
* 最初は空配列 `[]` からスタートし、最初のタイムライン（`SpeakContextTimeline`）が最初の Scene[] を作ります

---

## 既存タイムラインの役割

代表的なものだけ抜粋します。

### 1. SpeakContextTimeline

`src/timelines/speak-context-timeline.ts`

* GPT で生成されたスクリプト文字列を分割して、**Scene[] を初期化**します
* 文ごとに `speakContext` をセット
* どこで画像を切り替えるかなどの情報を `changeAttachedImageNext` に詰めます

### 2. CaptionContextTimeline

`src/timelines/caption-context-timeline.ts`

* `speakContext` を元に、**字幕用のテキスト（折り返し済み）** を `captionContext` に詰めます
* 1 行あたりの文字数や行数は `CaptionContextTimelineSettings` で調整可能

### 3. QuoteContextTimeline

`src/timelines/quote-context-timeline.ts`

* 最初のシーン群に対して `quoteContext` をセットします
* `changeAttachedImageNext` を見ながら、「ここまでが同じ引用文」というようなまとまりを作る想定

### 4. AudioConfiguredTimeline（音声生成）

`src/timelines/audio-configured-timeline.ts`

```ts
export interface IVoiceVox{
    request(context: string, outPath: string): Promise<void>
}
```

* `IVoiceVox` を使って VOICEVOX にリクエスト
* 各シーンの `speakContext` から音声を生成し、`audioPath` を埋めます
* 実装は `src/impls/voicevox.ts` に切り出されています

### 5. DurationConfiguredTimeLine（長さ計算）

`src/timelines/duration-configured-timeline.ts`

* `audioPath` を元に、音声ファイルの長さを取得し、`duration` に代入します
* ここも `IAudioDurationGetter` インターフェイスで抽象化されています

### 6. AttachedImageTimeline（元画像を割り当て）

`src/timelines/attached-image-timeline.ts`

* 渡された画像配列から `attachedImagePath` を割り当てます
* `changeAttachedImageNext` を見ながら、どこで画像を切り替えるかを制御しています

### 7. ImageRenderedTimeline（1 シーン分の PNG を描画）

`src/timelines/image-rendered-timeline.ts`

* `ISceneImageRenderer` を使って、1 シーン分の PNG を生成します
* 実装は `SceneImageRenderer`（`src/impls/image-renderer/scene-image-renderer.ts`）

  * 背景画像の合成
  * 字幕描画
  * 引用ラベル描画
  * フォント指定（`config.json` の `fontPath`）

### 8. VideoRenderedTimeline（シーンごとの MP4 を生成）

`src/timelines/video-rendered-timeline.ts`

* `ISceneVideoRenderer` を使って、PNG＋音声から 1 シーン分の MP4 を作ります
* 実装は `SceneVideoRenderer`（`src/impls/scene-video-renderer.ts`）で、内部的には FFmpeg を叩いています

---

## main.ts での組み立て

`src/main.ts` では、タイムラインの組み立てはだいたいこんな形です（抜粋）：

```ts
const builder = new SceneBuilder()
  .add(new SpeakContextTimeline(script))
  .add(new CaptionContextTimeline(new CaptionContextTimelineSettings()))
  .add(new QuoteContextTimeline(quoteContext))
  .add(new AudioConfiguredTimeline(new VoiceVoxImpl()))
  .add(new DurationConfiguredTimeLine(new DurationGetterImpl()))
  .add(new AttachedImageTimeline(imagePaths))
  .add(new ImageRenderedTimeline(new SceneImageRenderer()))
  .add(new VideoRenderedTimeline(new SceneVideoRenderer()));

const scenes = await builder.execute();
```

* **どの段階で Scene のどのフィールドが埋まるか** を意識して並べているのがポイントです
* 順番を変えると、まだ値が入っていないフィールドを参照してエラーになる可能性があります

---

## 拡張の基本パターン

### パターン1: 新しい ITimeline を追加する

「字幕にフィルタをかけたい」「Scene の並び順を変えたい」など、
**Scene の配列を加工したい場合は、`ITimeline` を実装したクラスを追加**するのが一番素直です。

例：字幕テキストを全部ひらがなに変換する（イメージ）

```ts
// src/timelines/hiragana-caption-timeline.ts
import { ITimeline } from "./interface";
import { Scene } from "../scene";

export class HiraganaCaptionTimeline implements ITimeline {
  async transform(scenes: Scene[]): Promise<Scene[]> {
    // 実際にはちゃんとした変換ロジックを書く
    for (const scene of scenes) {
      scene.captionContext = toHiragana(scene.captionContext);
    }
    return scenes;
  }
}

// ダミー実装（実際にはライブラリなどを使う）
function toHiragana(text: string): string {
  return text; // TODO: ここを好きに実装
}
```

これを `main.ts` の builder に追加：

```ts
const builder = new SceneBuilder()
  .add(new SpeakContextTimeline(script))
  .add(new CaptionContextTimeline(new CaptionContextTimelineSettings()))
  .add(new HiraganaCaptionTimeline())           // ← ここで追加
  .add(new QuoteContextTimeline(quoteContext))
  .add(new AudioConfiguredTimeline(new VoiceVoxImpl()))
  // ...
```

**ポイント**

* `transform` は **必ず Scene[] を返す**（配列を差し替えたい場合は新しい配列を作って返して OK）
* 副作用（ファイル I/O, ネットワークなど）は、必要ならインターフェイス＋impl を分けるとテストしやすい

---

### パターン2: レンダリングや音声の「実装」を差し替える

`ITimeline` 自体はいじらず、**impl を差し替えるだけ** でも、かなりアレンジできます。

例：

* VOICEVOX ではなく別の TTS サービスを使いたい

  * `IVoiceVox` と同じインターフェイスを持った `MyTTSImpl` を作る
  * `new AudioConfiguredTimeline(new MyTTSImpl())` に差し替え
* PNG の描画スタイルを変えたい

  * `ISceneImageRenderer` を実装した別クラスを作る
  * `new ImageRenderedTimeline(new MySceneImageRenderer())` にする

---

### パターン3: Scene にフィールドを追加してパイプラインを増やす

もっと大きくアレンジしたい場合は、

1. `Scene` にフィールドを追加
2. そのフィールドを計算する `ITimeline` を追加
3. そのフィールドを使うレンダラーや impl を変更

という流れで、**パイプラインを一段増やす**ことができます。

例（概念）：

```ts
// Scene に背景色フィールドを追加
export class Scene {
  // ...
  backgroundColor: string = "#000000";
}

// 背景色を決めるタイムライン
class BackgroundColorTimeline implements ITimeline {
  async transform(scenes: Scene[]): Promise<Scene[]> {
    for (const scene of scenes) {
      scene.backgroundColor = decideColor(scene.speakContext);
    }
    return scenes;
  }
}
```

---

## 実装上の注意点

* **順番依存に気をつける**

  * `AudioConfiguredTimeline` より前では `audioPath` は空
  * `DurationConfiguredTimeLine` より前では `duration` は未設定
  * `ImageRenderedTimeline` より前では `renderedImagePath` は空
* **パスはできるだけ `makePathAbsolute` を使う**

  * 相対パスと実行ディレクトリのズレでハマりやすいので、既存コードに倣うのがおすすめです
* **FFmpeg はコマンドエラーが起きやすい**

  * デバッグ時は `exec` / `spawn` の stderr をコメントアウトせずログを見た方が原因が掴みやすいです

---

## まとめ

* 中心には **Scene** というシンプルなドメインモデルがあり、
* **ITimeline のパイプライン** で Scene[] を段階的に加工し、
* 実際のレンダリングや音声生成などの **副作用は impl 層** が担当し、
* その結果（ファイルパスなど）を **Scene に書き戻し続ける** ことで、
* 最終的な動画ができあがる設計になっています。

アレンジしたいときは、まずは

* 「新しい ITimeline を 1 個追加してみる」
* 「既存の impl を差し替えてみる」

あたりから触ってみると、構造が掴みやすいと思います。
