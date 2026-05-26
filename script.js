function removePdfLineBreaks() {
    const inputText = document.getElementById('inputTextArea').value;
    const startChar = parseInt(document.getElementById('startCharCountInput').value);
    const endChar = parseInt(document.getElementById('endCharCountInput').value);

    // 入力値のバリデーション
    if (isNaN(startChar) || startChar < 1 || isNaN(endChar) || endChar < 1) {
        alert('有効な開始文字数と終了文字数を入力してください (1以上の半角数字)。');
        return;
    }
    if (startChar > endChar) {
        alert('開始文字数は終了文字数以下にしてください。');
        return;
    }

    let resultText = '';
    
    // 最初にCRLF, CRをLFに統一し、全角スペースを半角スペースに変換
    let cleanedInput = inputText.replace(/\r\n|\r/g, '\n').replace(/　/g, ' ');

    // 2つ以上の連続改行を「段落区切りマーカー」に変換
    // これにより、段落間の改行は保持しつつ、途中の改行を処理しやすくする
    const paragraphs = cleanedInput.split('\n\n'); // まず、2つ以上の改行で段落に分割

    paragraphs.forEach(paragraph => {
        let currentBuffer = ''; // 各段落内の処理用バッファ
        const lines = paragraph.split('\n'); // 段落内を単一改行でさらに分割

        lines.forEach((line, index) => {
            const trimmedLine = line.trim(); // 行頭・行末の空白を削除

            // 空行はスキップ
            if (trimmedLine === '') {
                return;
            }

            // currentBufferが空の場合、または結合してもまだ指定範囲に達していない場合
            if (currentBuffer === '') {
                currentBuffer = trimmedLine;
            } else {
                // currentBufferの現在の長さが指定範囲内かどうかをチェック
                if (currentBuffer.length >= startChar && currentBuffer.length <= endChar) {
                    // 末尾が句読点でない場合に改行を削除して結合
                    const lastChar = currentBuffer.slice(-1);
                    if (!/[、。？！）」』]/.test(lastChar)) {
                        currentBuffer += trimmedLine; // 改行なしで結合
                    } else {
                        // 句読点で終わる場合は、一旦バッファを確定して改行し、新しい行を開始
                        resultText += currentBuffer + '\n';
                        currentBuffer = trimmedLine;
                    }
                } else {
                    // 指定範囲外なので、通常通り改行して結合
                    resultText += currentBuffer + '\n';
                    currentBuffer = trimmedLine;
                }
            }
        });
        
        // 各段落の最後に残ったバッファの内容を追加
        if (currentBuffer !== '') {
            resultText += currentBuffer;
        }
        // 段落の最後には2つの改行を追加（ただし、最終段落の最後には追加しない）
        if (paragraph !== paragraphs[paragraphs.length - 1]) {
            resultText += '\n\n';
        }
    });

    // 最終的な調整: 余分な空白の削除など
    resultText = resultText.replace(/[ \t]+/g, ' ').trim(); // 連続する半角スペースを1つに、前後の空白を削除
    document.getElementById('outputTextArea').value = resultText;
}
