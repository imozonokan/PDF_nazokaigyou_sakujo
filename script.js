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

    // --- ここからα/βマーク方式の処理 ---
    
    // 1. CRLF, CRをLFに統一し、全角スペースを半角スペースに変換
    let processedText = inputText.replace(/\r\n|\r/g, '\n').replace(/　/g, ' ');

    // 2. 全改行（\n）を一時的なαマークに変換
    //    ただし、連続する2つ以上の改行は、段落区切りとして維持するために、
    //    まず「\n\n」を特別なマークに変換し、その後「\n」をαマークに変換し、
    //    最後に特別なマークを「\n\n」に戻す、という手順を取る。
    //    これにより、作者が意図した段落間の「間」を保持できる。
    const PARAGRAPH_SEP_MARK = '{{PARAGRAPH_SEPARATOR}}';
    const LINE_BREAK_ALPHA_MARK = '{{LINE_BREAK_ALPHA}}';

    processedText = processedText.replace(/\n\n+/g, PARAGRAPH_SEP_MARK); // 連続改行を一時マーク
    processedText = processedText.replace(/\n/g, LINE_BREAK_ALPHA_MARK); // 残りの単一改行をαマーク

    let currentResult = '';
    let currentLineLength = 0; // 現在処理中の「論理的な行」の文字数をカウント

    for (let i = 0; i < processedText.length; i++) {
        const char = processedText[i];

        if (char === LINE_BREAK_ALPHA_MARK[0] && processedText.substring(i, i + LINE_BREAK_ALPHA_MARK.length) === LINE_BREAK_ALPHA_MARK) {
            // αマークが見つかった場合
            // 直前の文字列長が指定範囲内にあるかチェック
            if (currentLineLength >= startChar && currentLineLength <= endChar) {
                // 句読点（、。？！）」』）で終わっていない場合にβマーク（削除対象）に変換
                const lastNonAlphaChar = currentResult.slice(-1); // 現在の行の末尾文字
                if (!/[、。？！）」』]/.test(lastNonAlphaChar)) {
                    // ここでβマークに変換する代わりに、何も追加しない（つまり削除）
                    // または、後で削除しやすいように別のマークに変換
                    // 今回は、一時的に「削除対象マーク」を追加し、後で一括削除する
                    currentResult += '{{DELETE_THIS_LINE_BREAK}}';
                } else {
                    // 句読点で終わる場合は改行として残す（αマークをそのまま追加）
                    currentResult += LINE_BREAK_ALPHA_MARK;
                }
            } else {
                // 指定範囲外なのでαマークをそのまま追加（改行として残す）
                currentResult += LINE_BREAK_ALPHA_MARK;
            }
            // αマークを処理したら、次の行が始まるので、現在の行の長さをリセット
            currentLineLength = 0;
            i += LINE_BREAK_ALPHA_MARK.length - 1; // αマークの長さ分インデックスを進める
        } else if (char === PARAGRAPH_SEP_MARK[0] && processedText.substring(i, i + PARAGRAPH_SEP_MARK.length) === PARAGRAPH_SEP_MARK) {
            // 段落区切りマークが見つかった場合
            // 直前のバッファに何かあれば確定
            if (currentLineLength > 0) {
                 // 強制的に改行として残す
                 currentResult += LINE_BREAK_ALPHA_MARK; 
            }
            currentResult += PARAGRAPH_SEP_MARK; // 段落区切りマークをそのまま追加
            currentLineLength = 0; // リセット
            i += PARAGRAPH_SEP_MARK.length - 1; // マークの長さ分インデックスを進める
        }
        else {
            // 通常の文字の場合
            currentResult += char;
            currentLineLength++;
        }
    }

    // 3. βマーク（削除対象マーク）を削除
    currentResult = currentResult.replace(/{{DELETE_THIS_LINE_BREAK}}/g, '');

    // 4. 残ったαマークを改行に、段落区切りマークを連続改行に戻す
    currentResult = currentResult.replace(new RegExp(LINE_BREAK_ALPHA_MARK, 'g'), '\n');
    currentResult = currentResult.replace(new RegExp(PARAGRAPH_SEP_MARK, 'g'), '\n\n');

    // 最終的な調整: 連続する半角スペースを1つに、前後の空白を削除
    currentResult = currentResult.replace(/[ \t]+/g, ' ').trim(); 
    document.getElementById('outputTextArea').value = currentResult;
}
