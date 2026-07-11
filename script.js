// 定数
const LINE_BREAK_ALPHA_MARK = '{{LB_ALPHA}}';
const PARAGRAPH_SEP_MARK = '{{PARAGRAPH_SEP}}';
const DELETE_TARGET_MARK = '{{DELETE_LB}}';

// ページ読み込み時の初期化処理
window.addEventListener('DOMContentLoaded', () => {
    // --- 入力エリアのリアルタイム処理設定 ---
    const inputArea = document.getElementById('inputTextArea');
    const startInput = document.getElementById('startCharCountInput');
    const endInput = document.getElementById('endCharCountInput');

    // 文字入力、貼り付け、削除時に処理を実行
    inputArea.addEventListener('input', processText);
    // 文字数設定の変更時にも処理を実行
    startInput.addEventListener('input', processText);
    endInput.addEventListener('input', processText);

    // --- 文字数カウントエリアの設定 ---
    const counterArea = document.getElementById('charCounterArea');
    
    // 入力、貼り付け時にカウントを更新
    counterArea.addEventListener('input', handleCounterInput);
    // ペーストイベントは特殊なため、少し遅延させてDOMの確定を待つ
    counterArea.addEventListener('paste', (e) => {
        setTimeout(handleCounterInput, 0);
    });
});

/**
 * メインの改行整理処理
 */
function processText() {
    const inputArea = document.getElementById('inputTextArea');
    const outputArea = document.getElementById('outputTextArea');
    const startInput = document.getElementById('startCharCountInput');
    const endInput = document.getElementById('endCharCountInput');

    const inputText = inputArea.value;
    
    // 空欄の場合はデフォルト値を使用
    const startChar = parseInt(startInput.value) || 28; 
    const endChar = parseInt(endInput.value) || 30;

    // 入力値のバリデーション
    if (startChar < 1 || endChar < 1) {
        return; // 正の数でなければ何もしない
    }
    if (startChar > endChar) {
        outputArea.value = 'エラー：開始文字数は終了文字数以下にしてください。';
        return;
    }

    if (!inputText) {
        outputArea.value = '';
        return;
    }

    // 1. 改行コードの統一と全角スペースの半角化
    let processedText = inputText.replace(/\r\n|\r/g, '\n').replace(/　/g, ' ');

    // 2. 改行の種類のマーク化
    // 連続する改行(空行)は段落として保護
    processedText = processedText.replace(/\n\n+/g, PARAGRAPH_SEP_MARK); 
    // 単一の改行は整理対象としてマーク
    processedText = processedText.replace(/\n/g, LINE_BREAK_ALPHA_MARK);

    let currentResult = ''; 
    let currentLogicalLineLength = 0; 

    // マークを考慮しながらテキストを再構築
    for (let i = 0; i < processedText.length; i++) {
        const char = processedText[i];
        let matchedMark = null;

        // マークの判定
        if (processedText.substring(i, i + LINE_BREAK_ALPHA_MARK.length) === LINE_BREAK_ALPHA_MARK) {
            matchedMark = LINE_BREAK_ALPHA_MARK;
        } else if (processedText.substring(i, i + PARAGRAPH_SEP_MARK.length) === PARAGRAPH_SEP_MARK) {
            matchedMark = PARAGRAPH_SEP_MARK;
        }

        if (matchedMark) {
            if (matchedMark === LINE_BREAK_ALPHA_MARK) {
                // 単一改行の場合
                // 現在の行が指定範囲内かチェック
                if (currentLogicalLineLength >= startChar && currentLogicalLineLength <= endChar) {
                    const lastCharBeforeMark = currentResult.slice(-1);
                    // 句読点などの場合は改行を維持
                    if (!/[、。？！）」』]/.test(lastCharBeforeMark)) {
                        currentResult += DELETE_TARGET_MARK; // 削除
