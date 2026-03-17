const XLSX = require('xlsx');
const path = require('path');

function readHeaders() {
    const filePath = path.join(__dirname, '..', 'Uyarvom_Products_Updated.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = data[0];
    const firstRow = data[1];

    headers.forEach((h, i) => {
        console.log(`${i}: ${h} => ${firstRow[i]}`);
    });
}

readHeaders();
