function removePdfLineBreaks() {
    const inputText = document.getElementById('inputTextArea').value;
    const specifiedLength = parseInt(document.getElementById('charCountInput').value);

    if (isNaN(specifiedLength) || specifiedLength <= 0) {
        alert('有効な文字数を入力してください (1以上の半角数字)。');
        return;
    }

    // まず、余分なスペースやタブ、連続する改行を整理します。
    // PDFからのコピーでは、余計な空白が混じることが多いため。
    let cleanedText = inputText.replace(/[ 　\t]+/g, ' ').replace(/\r\n|\r/g, '\n');
    // 連続する2つ以上の改行は、段落の区切りとして残し、それ以外は1つにまとめる
    cleanedText = cleanedText.replace(/\n{2,}/g, '\n\n'); 
    
    let result = '';
    let currentBuffer = ''; // 指定文字数までの一時的な文字列

    // 段落ごとに処理するために、一旦連続する改行で分割する
    const paragraphs = cleanedText.split('\n\n');

    paragraphs.forEach(paragraph => {
        // 各段落内で、短い改行を削除していく
        let tempParagraph = '';
        const linesInParagraph = paragraph.split('\n');

        linesInParagraph.forEach((line, index) => {
            const trimmedLine = line.trim(); // 行頭・行末の空白を削除

            // バッファと現在の行を結合したときに指定文字数を超えないかチェック
            // ただし、空行の場合はスキップ
            if (trimmedLine === '') {
                // 空行はそのまま処理せず、後で段落区切りとして扱う
            } else if ((tempParagraph.length + trimmedLine.length <= specifiedLength) || tempParagraph === '') {
                // バッファが空、または指定文字数以内なら結合
                tempParagraph += trimmedLine;
            } else {
                // 指定文字数を超えそうになった場合
                // tempParagraph の末尾が句読点でないなら、改行を削除してつなげる
                const lastCharOfBuffer = tempParagraph.slice(-1);
                if (!/[、。？！）」』])/.test(lastCharOfBuffer)) {
                    result += tempParagraph + ''; // 改行を削除して結合
                } else {
                    result += tempParagraph + '\n'; // 句読点で終わるなら改行
                }
                tempParagraph = trimmedLine; // 新しい行をバッファに入れる
            }
        });
        
        // 段落の最後のバッファ内容を追加
        if (tempParagraph !== '') {
            result += tempParagraph;
        }
        // 各段落の最後に区切りの改行を追加
        result += '\n\n';
    });

    // 最後の余分な改行を削除
    result = result.trimEnd();

    document.getElementById('outputTextArea').value = result;
}
