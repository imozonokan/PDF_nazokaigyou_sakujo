// αマークと段落区切りマークの定数（HTMLと合わせる必要なし、JS内部でのみ使用）
const LINE_BREAK_ALPHA_MARK = '{{LB_ALPHA}}'; // 単一改行の仮マーク
const PARAGRAPH_SEP_MARK = '{{PARAGRAPH_SEP}}'; // 連続改行の仮マーク
const DELETE_TARGET_MARK = '{{DELETE_LB}}'; // 削除対象の改行マーク

/**
 * PDFからの改行を整理するメイン関数
 */
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

    // 1. CRLF, CRをLFに統一し、全角スペースを半角スペースに変換
    let processedText = inputText.replace(/\r\n|\r/g, '\n').replace(/　/g, ' ');

    // 2. 連続する2つ以上の改行を段落区切りマークに、単一改行をαマークに変換
    processedText = processedText.replace(/\n\n+/g, PARAGRAPH_SEP_MARK); 
    processedText = processedText.replace(/\n/g, LINE_BREAK_ALPHA_MARK);

    let currentResult = ''; // 処理中の出力文字列
    let currentLogicalLineLength = 0; // 現在構築中の「論理的な行」の文字数（マークを含まない）

    for (let i = 0; i < processedText.length; i++) {
        // 現在の文字またはマークを判定
        const char = processedText[i];
        let matchedMark = null;

        if (processedText.substring(i, i + LINE_BREAK_ALPHA_MARK.length) === LINE_BREAK_ALPHA_MARK) {
            matchedMark = LINE_BREAK_ALPHA_MARK;
        } else if (processedText.substring(i, i + PARAGRAPH_SEP_MARK.length) === PARAGRAPH_SEP_MARK) {
            matchedMark = PARAGRAPH_SEP_MARK;
        }

        if (matchedMark) {
            // マークが見つかった場合
            if (matchedMark === LINE_BREAK_ALPHA_MARK) {
                // αマークの場合
                if (currentLogicalLineLength >= startChar && currentLogicalLineLength <= endChar) {
                    // 指定範囲内の長さの場合
                    const lastCharBeforeMark = currentResult.slice(-1); // 直前の文字
                    // 句読点でない場合は削除対象マークに変換
                    if (!/[、。？！）」』]/.test(lastCharBeforeMark)) {
                        currentResult += DELETE_TARGET_MARK;
                    } else {
                        // 句読点ならαマークを維持
                        currentResult += LINE_BREAK_ALPHA_MARK;
                    }
                } else {
                    // 指定範囲外なのでαマークを維持
                    currentResult += LINE_BREAK_ALPHA_MARK;
                }
                // αマークを処理したら、現在の論理的な行は終わるので長さをリセット
                currentLogicalLineLength = 0;
            } else if (matchedMark === PARAGRAPH_SEP_MARK) {
                // 段落区切りマークの場合（常に維持）
                // 直前のバッファに論理行があれば、強制的に改行として扱う
                if (currentLogicalLineLength > 0) {
                    currentResult += LINE_BREAK_ALPHA_MARK; // 段落前で確定
                }
                currentResult += PARAGRAPH_SEP_MARK;
                currentLogicalLineLength = 0; // リセット
            }
            // マークの長さ分、インデックスを進める
            i += matchedMark.length - 1;
        } else {
            // 通常の文字の場合
            currentResult += char;
            currentLogicalLineLength++;
        }
    }

    // 3. 削除対象マークを空文字に置換して削除
    currentResult = currentResult.replace(new RegExp(DELETE_TARGET_MARK, 'g'), '');

    // 4. 残ったαマークを改行に、段落区切りマークを連続改行に戻す
    currentResult = currentResult.replace(new RegExp(LINE_BREAK_ALPHA_MARK, 'g'), '\n');
    currentResult = currentResult.replace(new RegExp(PARAGRAPH_SEP_MARK, 'g'), '\n\n');

    // 最終的な調整: 連続する半角スペースを1つに、前後の空白を削除
    currentResult = currentResult.replace(/[ \t]+/g, ' ').trim(); 
    document.getElementById('outputTextArea').value = currentResult;
}

/**
 * 出力されたテキストをクリップボードにコピーする関数
 */
function copyOutputText() {
    const outputTextArea = document.getElementById('outputTextArea');
    outputTextArea.select(); // テキストエリアのテキストを選択
    navigator.clipboard.writeText(outputTextArea.value) // クリップボードにコピー
        .then(() => {
            alert('出力結果をクリップボードにコピーしました！');
        })
        .catch(err => {
            console.error('コピーに失敗しました:', err);
            alert('コピーに失敗しました。お使いのブラウザが対応していないか、セキュリティ設定をご確認ください。');
        });
}

/**
 * 入力と出力のテキストエリアをリセットする関数
 */
function resetTextAreas() {
    document.getElementById('inputTextArea').value = '';
    document.getElementById('outputTextArea').value = '';
    document.getElementById('charCounterArea').innerHTML = 'ここにPDFからコピーした文章を貼り付けてください。'; // カウントエリアもリセット
}

/**
 * 文字数カウント表示を更新する関数
 * (charCounterAreaのoninput/onkeyupイベントで呼び出される)
 */
function updateCharCountDisplay() {
    const charCounterArea = document.getElementById('charCounterArea');
    const rawText = charCounterArea.innerText; // contenteditableのテキストを取得

    // 改行コードを統一し、余分な空白を整理
    const lines = rawText.replace(/\r\n|\r/g, '\n').split('\n');
    
    let htmlContent = '';
    lines.forEach(line => {
        // 文字列の末尾に全角スペースなどがある場合も考慮し、trimEnd()を使用
        const trimmedLine = line.trimEnd(); 
        const charCount = trimmedLine.length;
        // data-char-count 属性に文字数を持たせ、CSSの::afterで表示
        // HTMLエンティティ化してXSS対策
        htmlContent += `<span class="line" data-char-count="${charCount}文字">${escapeHtml(line)}</span>`;
    });
    charCounterArea.innerHTML = htmlContent;
}

/**
 * HTMLエンティティ化してXSS攻撃を防ぐユーティリティ関数
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ページロード時にカウントエリアの初期表示を更新
window.onload = function() {
    updateCharCountDisplay();
};
