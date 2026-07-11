// αマークと段落区切りマークの定数（HTMLと合わせる必要なし、JS内部でのみ使用）
const LINE_BREAK_ALPHA_MARK = '{{LB_ALPHA}}'; // 単一改行の仮マーク
const PARAGRAPH_SEP_MARK = '{{PARAGRAPH_SEP}}'; // 連続改行の仮マーク
const DELETE_TARGET_MARK = '{{DELETE_LB}}'; // 削除対象の改行マーク

/**
 * 入力エリアの文字が変わったときに自動実行する関数
 */
function autoProcess() {
    // 実際の処理を実行
    processText();
}

/**
 * PDFからの改行を整理するメイン処理
 */
function processText() {
    const inputText = document.getElementById('inputTextArea').value;
    // 空欄の場合はデフォルト値を使用
    const startChar = parseInt(document.getElementById('startCharCountInput').value || '28'); 
    const endChar = parseInt(document.getElementById('endCharCountInput').value || '30');

    // 入力値のバリデーション
    if (isNaN(startChar) || startChar < 1 || isNaN(endChar) || endChar < 1) {
        // 設定値がおかしい場合は処理しない（またはデフォルトで動かすかはお好みで）
        // ここでは何もしないでおきます
        return;
    }
    if (startChar > endChar) {
        document.getElementById('outputTextArea').value = 'エラー：開始文字数は終了文字数以下にしてください。';
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
                    // 指定範囲内的長さの場合
                    const lastCharBeforeMark = currentResult.slice(-1); // 直前の文字
                    // 句読点でない場合は削除対象マークに変換
                    if (!/[、。？！）」』]/.test(lastCharBeforeMark)) {
                        currentResult += DELETE_TARGET_MARK;
                    } else {
                        // 句読点ならαマークを維持（改行を入れる）
                        currentResult += LINE_BREAK_ALPHA_MARK;
                    }
                } else {
                    // 指定範囲外なのでαマークを維持（改行を入れる）
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
    
    // 結果を出力
    document.getElementById('outputTextArea').value = currentResult;
}

/**
 * 出力されたテキストをクリップボードにコピーする関数
 */
function copyOutputText() {
    const outputTextArea = document.getElementById('outputTextArea');
    outputTextArea.select(); 
    try {
        outputTextArea.setSelectionRange(0, 99999); 
    } catch (e) {}

    navigator.clipboard.writeText(outputTextArea.value)
        .then(() => {
            showCopyMessage(); 
        })
        .catch(err => {
            console.error('コピーに失敗しました:', err);
        });
}

/**
 * コピー成功メッセージを表示する関数
 */
function showCopyMessage() {
    const copyMessage = document.getElementById('copyMessage');
    copyMessage.classList.add('show');
    setTimeout(() => {
        copyMessage.classList.remove('show');
    }, 2000);
}

/**
 * 入力と出力のテキストエリアのみをリセットする関数
 * (文字数カウント枠と設定値は保持)
 */
function resetInputOutput() {
    document.getElementById('inputTextArea').value = '';
    document.getElementById('outputTextArea').value = '';
    // inputイベントを発動させて出力側も確実に空にする
    autoProcess(); 
}

/**
 * 文字数カウントエリアへの直接入力/ペースト時の処理
 */
function handleCounterInput() {
    updateCharCountDisplay();
}

function handleCounterPaste() {
    // ペーストされた瞬間に文字数を再計算するために少し遅延させる
    setTimeout(updateCharCountDisplay, 0);
}

/**
 * 文字数カウント表示を更新する関数 (主要ロジック)
 */
function updateCharCountDisplay() {
    const charCounterArea = document.getElementById('charCounterArea');
    const maxCharDisplay = document.getElementById('maxCharDisplay');
    
    // contenteditable からテキストを取得 (innerText を使用)
    let text = charCounterArea.innerText;

    // 改行コードを統一
    text = text.replace(/\r\n|\r/g, '\n');

    // 空の場合はリセットして終了
    if (text.length === 0) {
        charCounterArea.innerHTML = '';
        maxCharDisplay.textContent = '最大文字数：0';
        return;
    }

    const lines = text.split('\n');
    let htmlContent = '';
    let maxLen = 0;

    lines.forEach(line => {
        // 行ごとの文字数をカウント (全角/半角問わず1文字としてカウント)
        const len = line.length;
        if (len > maxLen) maxLen = len;

        // HTMLを組み立て。スタイルはCSSで定義済み
        htmlContent += `<span class="line" data-char-count="${len}文字">${escapeHtml(line)}</span>`;
    });

    // 表示を更新
    charCounterArea.innerHTML = htmlContent;
    maxCharDisplay.textContent = `最大文字数：${maxLen}`;
}

/**
 * HTMLエスケープ処理 (XSS対策)
 */
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// ページロード時の初期化処理は特に不要（HTMLのプレースホルダーが機能するため）
