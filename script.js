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

    // 2つ以上の連続改行を「段落区切りマーカー」に変換し、一旦、段落に分割
    const paragraphs = cleanedInput.split('\n\n'); 

    paragraphs.forEach((paragraph, paragraphIndex) => {
        // 各段落内の単一改行を、一時的な内部改行マーカーに変換
        // これで段落全体を一つの文字列として扱えるようにする
        let processedParagraph = paragraph.replace(/\n/g, '<LINE_BREAK>');

        let currentProcessedText = '';
        let lastMatchIndex = 0; // 処理済みの部分のインデックス

        // 段落全体をループし、指定範囲内の改行マーカーを削除
        for (let i = 0; i < processedParagraph.length; i++) {
            currentProcessedText += processedParagraph[i];

            // 改行マーカーが見つかった場合
            if (currentProcessedText.endsWith('<LINE_BREAK>')) {
                const effectiveLength = currentProcessedText.length - '<LINE_BREAK>'.length; // マーカーを含まない文字列の長さ

                // マーカーの前の文字列の長さが指定範囲内かどうか、かつ末尾が句読点でないか
                if (effectiveLength >= startChar && effectiveLength <= endChar) {
                    const lastCharBeforeBreak = currentProcessedText.slice(0, effectiveLength).slice(-1);
                    if (!/[、。？！）」』]/.test(lastCharBeforeBreak)) {
                        // 句読点でないなら改行マーカーを削除（空文字に置換）
                        currentProcessedText = currentProcessedText.slice(0, effectiveLength);
                        // 次の行との間に半角スペースを入れるかはお好みで。今回はそのまま連結
                    } else {
                        // 句読点で終わるなら改行マーカーを本物の改行に戻す
                        currentProcessedText = currentProcessedText.slice(0, effectiveLength) + '\n';
                    }
                } else {
                    // 指定範囲外なら改行マーカーを本物の改行に戻す
                    currentProcessedText = currentProcessedText.slice(0, effectiveLength) + '\n';
                }
            }
        }

        // 最後の調整と、残っている内部マーカーを本物の改行に変換
        currentProcessedText = currentProcessedText.replace(/<LINE_BREAK>/g, '\n');
        resultText += currentProcessedText.trimEnd();

        // 最終段落でなければ段落間に改行を追加
        if (paragraphIndex < paragraphs.length - 1) {
            resultText += '\n\n';
        }
    });

    // 最終的な調整: 連続する空白の削除など
    resultText = resultText.replace(/[ \t]+/g, ' ').trim(); 
    document.getElementById('outputTextArea').value = resultText;
}
