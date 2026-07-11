// αマークと段落区切りマークの定数（JS内部でのみ使用）
const LINE_BREAK_ALPHA_MARK = '{{LB_ALPHA}}'; // 単一改行の仮マーク
const PARAGRAPH_SEP_MARK = '{{PARAGRAPH_SEP}}'; // 連続改行の仮マーク
const DELETE_TARGET_MARK = '{{DELETE_LB}}'; // 削除対象の改行マーク

/**
 * 入力エリアの文字が変わったときに自動実行する関数
 */
function autoProcess() {
    processText();
}

/**
 * PDFからの改行を整理するメイン処理
 */
function processText() {
    const inputText = document.getElementById('inputTextArea').value;
    const startChar = parseInt(document.getElementById('startCharCountInput').value || '28'); 
    const endChar = parseInt(document.getElementById('endCharCountInput').value || '30');

    if (isNaN(startChar) || startChar < 1 || isNaN(endChar) || endChar < 1) {
        return;
    }
    if (startChar > endChar) {
        document.getElementById('outputTextArea').value = 'エラー：開始文字数は終了文字数以下にしてください。';
        return;
    }

    let processedText = inputText.replace(/\r\n|\r/g, '\n').replace(/　/g, ' ');

    processedText = processedText.replace(/\n\n+/g, PARAGRAPH_SEP_MARK); 
    processedText = processedText.replace(/\n/g, LINE_BREAK_ALPHA_MARK);

    let currentResult = ''; 
    let currentLogicalLineLength = 0; 

    for (let i = 0; i < processedText.length; i++) {
        const char = processedText[i];
        let matchedMark = null;

        if (processedText.substring(i, i + LINE_BREAK_ALPHA_MARK.length) === LINE_BREAK_ALPHA_MARK) {
            matchedMark = LINE_BREAK_ALPHA_MARK;
        } else if (processedText.substring(i, i + PARAGRAPH_SEP_MARK.length) === PARAGRAPH_SEP_MARK) {
            matchedMark = PARAGRAPH_SEP_MARK;
        }

        if (matchedMark) {
            if (matchedMark === LINE_BREAK_ALPHA_MARK) {
                if (currentLogicalLineLength >= startChar && currentLogicalLineLength <= endChar) {
                    const lastCharBeforeMark = currentResult.slice(-1);
                    if (!/[、。？！）」』]/.test(lastCharBeforeMark)) {
                        currentResult += DELETE_TARGET_MARK;
                    } else {
                        currentResult += LINE_BREAK_ALPHA_MARK;
                    }
                } else {
                    currentResult += LINE_BREAK_ALPHA_MARK;
                }
                currentLogicalLineLength = 0;
            } else if (matchedMark === PARAGRAPH_SEP_MARK) {
                if (currentLogicalLineLength > 0) {
                    currentResult += LINE_BREAK_ALPHA_MARK;
                }
                currentResult += PARAGRAPH_SEP_MARK;
                currentLogicalLineLength = 0;
            }
            i += matchedMark.length - 1;
        } else {
            currentResult += char;
            currentLogicalLineLength++;
        }
    }

    currentResult = currentResult.replace(new RegExp(DELETE_TARGET_MARK, 'g'), '');
    currentResult = currentResult.replace(new RegExp(LINE_BREAK_ALPHA_MARK, 'g'), '\n');
    currentResult = currentResult.replace(new RegExp(PARAGRAPH_SEP_MARK, 'g'), '\n\n');

    currentResult = currentResult.replace(/[ \t]+/g, ' ').trim(); 
    
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
 */
function resetInputOutput() {
    document.getElementById('inputTextArea').value = '';
    document.getElementById('outputTextArea').value = '';
    autoProcess(); // リアルタイム処理を反映
}

// --- 修正部分: ここから下が主に変わっています ---

/**
 * contenteditable 内のHTMLから正しいテキストを取得する関数
 * (ブラウザによる改行タグの違いを吸収する)
 */
function getPlainTextFromHtml(html) {
    // 一時的な div 要素を作成して HTML をパースする
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // 改行タグ (<br>, <p>, <div>) をユニークなマーカーに置換してからテキストを取得する
    // 連続するタグを1つの改行として扱うための処理
    
    // 1. div, p タグはブロックの終わり（改行）とみなす
    // </p></div> の後ろなどに BR があると空行が重複するので、まずタグを置換
    
    // div や p の閉じタグを改行コードに変換
    let htmlWithLineBreaks = html.replace(/<\/div>/gi, '\n')
                                 .replace(/<\/p>/gi, '\n')
                                 .replace(/<br\s*\/?>/gi, '\n'); // brタグも改行に

    tempDiv.innerHTML = htmlWithLineBreaks;
    
    // テキストを取得（innerTextを使うと、ここできれいにスペースや改行が調整される）
    let text = tempDiv.innerText || tempDiv.textContent;

    // 念の為、連続する改行を整理（最大2つまでにするなどはお好みで、今回はそのまま表示します）
    // text = text.replace(/\n\n+/g, '\n\n');

    return text;
}

/**
 * 文字数カウントエリアへの入力/ペースト時の共通処理
 */
function handleCounterChange() {
    const charCounterArea = document.getElementById('charCounterArea');
    const maxCharDisplay = document.getElementById('maxCharDisplay');

    // contenteditable の現在の HTML を取得
    const htmlContent = charCounterArea.innerHTML;
    
    // HTMLからプレーンテキストを抽出する関数を通す
    const text = getPlainTextFromHtml(htmlContent);

    // 全体の文字数が0ならリセットして終了
    if (text.length === 0) {
        // 完全に空になった場合はHTMLも空にする（プレースホルダー表示のため）
        if (charCounterArea.innerHTML !== '') {
            charCounterArea.innerHTML = '';
        }
        maxCharDisplay.textContent = '最大文字数：0';
        return;
    }

    // テキストを行に分割
    const lines = text.split('\n');
    
    let newHtml = '';
    let maxLen = 0;

    lines.forEach((line) => {
        // 各行の文字数をカウント（改行コードは含まない）
        const len = line.length;
        if (len > maxLen) maxLen = len;

        // spanタグで囲んで文字数データを付与し、HTMLを再構築
        // escapeHtml を通してXSS対策
        newHtml += `<span class="line" data-char-count="${len}文字">${escapeHtml(line)}</span>`;
    });

    // 表示を更新
    if (charCounterArea.innerHTML !== newHtml) {
        charCounterArea.innerHTML = newHtml;
        
        // カーソル位置がずれるのを防ぐための処理（複雑になるので今回は割愛。
        // 文字数が多い状態で更新するとカーソルが先頭に戻る可能性があります。
        // 気になる場合はIME入力中は更新を止めるなどの制御が必要です。）
    }
    
    maxCharDisplay.textContent = `最大文字数：${maxLen}`;
}

// イベントハンドラを整理
function handleCounterInput() {
    handleCounterChange();
}

function handleCounterPaste(e) {
    // ペースト時はデフォルトの挙動を一度キャンセルし、テキストのみを取得して挿入するなどの工夫が必要だが、
    // 今回はシンプルにペースト後に少し遅延させて再計算する方式を採用
    setTimeout(handleCounterChange, 100); 
}

/**
 * HTMLエスケープ処理
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
