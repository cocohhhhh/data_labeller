let lines = [];
let headers = [];
let currentLine = 0;
let currentPage = 1;
const itemsPerPage = 25;
let totalItems = 0;
let notSureStatus = [];
let itemColors = []; // New array to keep track of item colors

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
        totalItems = lines.length;
        initializeAnnotation();
    };
    reader.readAsText(file);
});

function initializeAnnotation() {
    console.log("Initializing annotation...");
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('annotation-section').style.display = 'flex';
    createCategoryButtons();
    notSureStatus = new Array(lines.length).fill(false);
    itemColors = lines.map((line, index) => {
        const data = line.split(',');
        console.log(`Line ${index}:`, data);
        if (data.slice(1).some(value => value && value.trim() === '1')) {
            return 'labeled';
        } else {
            return 'unlabeled';
        }
    });
    console.log("Item colors:", itemColors);
    showCurrentLine();
    populateDataGrid(0);
    updatePageInfo();
}

function createCategoryButtons() {
    const categoryButtons = document.getElementById('categoryButtons');
    categoryButtons.innerHTML = '';
    console.log("Total headers:", headers.length);
    for (let i = 1; i < headers.length; i++) {
        console.log("Creating button for:", headers[i]);
        const button = document.createElement('button');
        button.textContent = headers[i];
        button.className = 'category-button';
        button.onclick = () => toggleCategory(i - 1);
        categoryButtons.appendChild(button);
    }
    console.log("Total buttons created:", categoryButtons.children.length);
}

function showCurrentLine() {
    const data = lines[currentLine].split(',');
    document.getElementById('sampleText').textContent = data[0] || '';
    document.getElementById('progress').textContent = `${currentLine + 1}/${lines.length}`;

    const buttons = document.getElementsByClassName('category-button');
    for (let i = 0; i < buttons.length; i++) {
        const value = data[i + 1] ? data[i + 1].trim() : '0';
        buttons[i].classList.toggle('selected', value === '1');
    }

    const notSureButton = document.querySelector('.not-sure-button');
    if (notSureButton) {
        notSureButton.classList.toggle('selected', notSureStatus[currentLine]);
    }
}

function toggleCategory(index) {
    console.log("Toggling category at index:", index);
    let data = lines[currentLine].split(',');
    console.log("Before toggle:", data);
    
    // Ensure the data array has enough elements
    while (data.length <= headers.length) {
        data.push('0');
    }
    
    // Toggle the value, handling potential undefined or empty values
    data[index + 1] = (data[index + 1] && data[index + 1].trim() === '1') ? '0' : '1';
    
    console.log("After toggle:", data);
    lines[currentLine] = data.join(',');
    showCurrentLine();
    updateGridItemStatus(currentLine);
}

function toggleNotSure() {
    notSureStatus[currentLine] = !notSureStatus[currentLine];
    updateGridItemStatus(currentLine);
    showCurrentLine();
}

function populateDataGrid(startIndex) {
    console.log("Populating data grid. Start index:", startIndex);
    const dataGrid = document.querySelector('.data-grid');
    dataGrid.innerHTML = '';
    for (let i = startIndex; i < startIndex + itemsPerPage && i < totalItems; i++) {
        const item = document.createElement('div');
        item.className = `data-item ${itemColors[i]}`; // Use the stored color
        item.textContent = i + 1;
        item.onclick = () => selectItem(i);
        dataGrid.appendChild(item);
        console.log(`Added item ${i + 1} with class ${itemColors[i]}`);
    }
    console.log("Grid populated. Items in grid:", dataGrid.children.length);
    updatePageInfo();
}

function isItemLabeled(index) {
    const data = lines[index].split(',');
    return data.slice(1).some(value => value.trim() === '1');
}

function isItemNotSure(index) {
    return notSureStatus[index];
}

function selectItem(index) {
    currentLine = index;
    showCurrentLine();
    updateGridItemStatus(index);
}

function updateGridItemStatus(index) {
    if (notSureStatus[index]) {
        itemColors[index] = 'not-sure';
    } else if (isItemLabeled(index)) {
        itemColors[index] = 'labeled';
    } else {
        itemColors[index] = 'unlabeled';
    }

    const gridIndex = index % itemsPerPage;
    const gridItems = document.querySelectorAll('.data-item');
    if (gridItems[gridIndex]) {
        gridItems[gridIndex].className = `data-item ${itemColors[index]}`;
    }
}

function previous() {
    if (currentLine > 0) {
        currentLine--;
        showCurrentLine();
        updateGridItemStatus(currentLine);
    }
}

function next() {
    if (currentLine < lines.length - 1) {
        currentLine++;
        showCurrentLine();
        updateGridItemStatus(currentLine);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateGrid();
        updatePageInfo();
        console.log("Previous page clicked. Current page:", currentPage);
    }
}

function nextPage() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateGrid();
        updatePageInfo();
        console.log("Next page clicked. Current page:", currentPage);
    }
}

function updateGrid() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    populateDataGrid(startIndex);
    console.log("Grid updated. Start index:", startIndex);
}

function updatePageInfo() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    console.log("Page info updated:", document.getElementById('page-info').textContent);
}

let saveTimeout = null;

function saveAnnotations() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(() => {
        console.log("saveAnnotations function called");
        if (lines.length === 0) {
            alert("No data to save.");
            return;
        }

        let csvContent = "";
        
        // Add headers
        csvContent += headers.join(",") + "\n";

        // Add data rows
        lines.forEach((line, index) => {
            const columns = line.split(',');
            const saveColumns = headers.map((header, i) => {
                if (i === 0) return columns[0]; // Always include the first column (text)
                return (columns[i] && columns[i].trim() === '1') ? '1' : '';
            });
            csvContent += saveColumns.join(",") + "\n";
        });

        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create a download link
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "annotated_data.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Your browser doesn't support direct downloads. Please use a modern browser like Chrome, Firefox, or Edge.");
        }
        
        saveTimeout = null;
    }, 300); // 300ms debounce
}

// Add event listeners for navigation buttons
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.removeEventListener('click', saveAnnotations);
        saveButton.addEventListener('click', saveAnnotations);
    }

    const prevPageButton = document.getElementById('prevPageButton');
    const nextPageButton = document.getElementById('nextPageButton');

    if (prevPageButton) {
        prevPageButton.addEventListener('click', previousPage);
        console.log("Previous page button listener added");
    }

    if (nextPageButton) {
        nextPageButton.addEventListener('click', nextPage);
        console.log("Next page button listener added");
    }
});