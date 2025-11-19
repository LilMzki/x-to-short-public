import kuromoji from "kuromoji";

interface Options {
  min: number;  // 最小文字数
  max: number;  // 最大文字数
  marker: string; // 挿入する記号
}

export async function createLineBreaker(options: {
  min: number;  // 最小文字数
  max: number;  // 最大文字数
  marker: string; // 挿入する記号
}) {
  const builder = kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" });

  const tokenizer = await new Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>>(
    (resolve, reject) => {
      builder.build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    }
  );

  return function breakLines(text: string): string {
    const tokens = tokenizer.tokenize(text);
    const chunks: string[] = [];
    let current = "";

    for (const t of tokens) {
      const next = current + t.surface_form;

      if (next.length > options.max) {
        // 7〜12文字を超えたので改行
        chunks.push(current);
        current = t.surface_form;
      } else {
        current = next;
      }
    }

    if (current) chunks.push(current);

    return chunks
      .map(chunk => chunk.length >= options.min ? chunk : chunk) // 必要なら調整可能
      .join(options.marker);
  };
}
