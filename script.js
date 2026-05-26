function removePdfLineBreaks() {
    const inputText = document.getElementById('inputTextArea').value;
    const startChar = parseInt(document.getElementById('startCharCountInput').value);
    const endChar = parseInt(document.getElementById('endCharCountInput').value);

    if (isNaN(startChar) || startChar <= 0 || isNaN(endChar) || endChar <= 0) {
        alert('有効な開始文字数と終了文字数を入力してください (1以上の半角数字)。');
        return;
    }
    if (startChar > endChar) {
        alert('開始文字数は終了文字数以下にしてください。');
        return;
    }

    let resultText = '';
    let currentLine = '';

    // まず、連続する改行を段落区切りとして残し、単一の改行は一時的に目印に変換
    // 例: "a\nb\n\nc\nd" -> "a<BR>b\n\nc<BR>d"
    // これにより、段落間の改行は保持しつつ、途中の改行を処理しやすくする
    const processedInput = inputText.replace(/\r\n|\r/g, '\n') // CRLFやCRをLFに統一
                                  .replace(/\n\n+/g, '<PARA_BREAK>'); // 2つ以上の連続改行を段落区切りマークに

    const lines = processedInput.split('\n'); // 一旦、単一改行で分割

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 段落区切りマークを見つけたら、そこで区切って処理し、バッファをリセット
        if (line.includes('<PARA_BREAK>')) {
            const parts = line.split('<PARA_BREAK>');
            currentLine += parts[0]; // マークの前の部分を現在の行に追加
            resultText += currentLine.trimEnd() + '\n\n'; // 現在の行を確定し、段落区切りを追加
            currentLine = parts[1]; // マークの後の部分から新しい行を開始
            continue;
        }

        // 現在の行が、指定された文字数範囲内に収まる場合
        // ただし、行の末尾が句読点や閉じ括弧などでない場合にのみ改行を削除する
        // (PDFからのコピペは、多くの場合、単語の途中で改行が入るため、これを結合したい)
        if (currentLine.length > 0 && 
            currentLine.length >= startChar && 
            currentLine.length <= endChar) 
        {
            // currentLineの末尾が「、。」などの句読点や閉じ括弧でないかを確認
            const lastChar = currentLine.slice(-1);
            if (!/[、。？！）」』]/.test(lastChar)) {
                // 句読点でないなら改行を削除して連結
                currentLine += line; // 現在の行に次の行を追加
            } else {
                // 句読点で終わるなら、ここで改行を確定
                resultText += currentLine.trimEnd() + '\n';
                currentLine = line; // 新しい行を開始
            }
        } else {
            // 文字数範囲外の場合、またはまだ範囲に達していない場合
            currentLine += line;
        }

        // 最後の行の処理 (ループの最後、または次の行が最後の<PARA_BREAK>の場合)
        if (i === lines.length - 1) {
            resultText += currentLine.trimEnd();
        }
    }

    // 最終的な調整: 連続する空白を1つにするなど (任意)
    resultText = resultText.replace(/[ 　\t]+/g, ' ').replace(/\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n');
    document.getElementById('outputTextArea').value = resultText;
}
