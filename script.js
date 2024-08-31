let lines = [];
let headers = [];
let currentLine = 0;

document.getElementById('startButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload a file first.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        headers = lines.shift().split(',').map(h => h.trim());
        initializeAnnotation();
    };
    reader.readAsText(file);
});

function initializeAnnotation() {
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('annotation-section').style.display = 'flex';
    createCategoryButtons();
    showCurrentLine();
}

function createCategoryButtons() {
    const container = document.getElementById('categoryButtons');
    container.innerHTML = '';
    for (let i = 1; i < headers.length; i++) {
        const button = document.createElement('button');
        button.textContent = headers[i];
        button.className = 'category-button';
        button.onclick = function() { toggleCategory(i); };
        container.appendChild(button);
    }
}

function showCurrentLine() {
    const data = lines[currentLine].split(',');
    document.getElementById('sampleText').textContent = data[0];
    document.getElementById('progress').textContent = `${currentLine + 1}/${lines.length}`;

    const buttons = document.getElementsByClassName('category-button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('selected', data[i + 1] === '1');
    }
}

function toggleCategory(index) {
    const data = lines[currentLine].split(',');
    data[index] = data[index] === '1' ? '0' : '1';
    lines[currentLine] = data.join(',');
    showCurrentLine();
}

function previous() {
    if (currentLine > 0) {
        currentLine--;
        showCurrentLine();
    }
}

function next() {
    if (currentLine < lines.length - 1) {
        currentLine++;
        showCurrentLine();
    }
}

function saveAnnotations() {
    const blob = new Blob([headers.join(',') + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotated_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'a' || e.key === 'A') {
        previous();
    } else if (e.key === 'd' || e.key === 'D') {
        next();
    }
});