const LINE_BREAK_ALPHA_MARK = '{{LB_ALPHA}}';
const PARAGRAPH_SEP_MARK = '{{PARAGRAPH_SEP}}';
const DELETE_TARGET_MARK = '{{DELETE_LB}}';

function autoProcess() {
    processText();
}

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

function showCopyMessage() {
    const copyMessage = document.getElementById('copyMessage');
    copyMessage.classList.add('show');
    setTimeout(() => {
