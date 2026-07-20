// ==========================================
// 1. GOOGLE SHEETS URL (PALITAN ITO NG LINK MO)
// ==========================================
// Dito mo i-paste ang Web App URL mula sa Google Apps Script
var GOOGLE_SCRIPT_URL = "DITO_IPASTE_ANG_GOOGLE_SCRIPT_URL";

// ==========================================
// 2. LOAD LOCAL HISTORY
// ==========================================
var scanHistory = JSON.parse(localStorage.getItem("myScans")) || [];

// ==========================================
// 3. AUTO-RESET LOGIC (Tuwing bagong araw)
// ==========================================
function checkAutoReset() {
    var today = new Date().toLocaleDateString();
    var lastSavedDate = localStorage.getItem("lastSavedDate");

    // Kung bagong araw na, burahin ang lumang records sa screen
    if (lastSavedDate && lastSavedDate !== today) {
        localStorage.removeItem("myScans");
        scanHistory = [];
    }
    localStorage.setItem("lastSavedDate", today);
}

// Patakbuhin agad ang check pagbukas ng app
checkAutoReset();

// ==========================================
// 4. INITIALIZE QR SCANNER
// ==========================================
var scanner = new Html5QrcodeScanner("reader", { 
    fps: 10, 
    qrbox: 250 
});

// ==========================================
// 5. UPDATE TABLE UI (DISPLAY RECORDS)
// ==========================================
function updateUI() {
    var tbody = document.getElementById("historyBody");
    if (!tbody) return;
    tbody.innerHTML = ""; // Linisin muna bago maglagay ng bago

    for (var i = 0; i < scanHistory.length; i++) {
        var item = scanHistory[i];
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${item.name}</td>
                <td>${item.date}</td>
                <td>${item.time}</td>
            </tr>
        `;
    }
}

// ==========================================
// 6. SEND DATA TO GOOGLE SHEETS
// ==========================================
function sendToGoogleSheets(name, date, time) {
    var statusDiv = document.getElementById("status");
    
    // Check kung napalitan na yung URL
    if (GOOGLE_SCRIPT_URL === "DITO_IPASTE_ANG_GOOGLE_SCRIPT_URL") {
        if (statusDiv) statusDiv.innerHTML = "⚠️ Paalala: Ilagay ang Google Script URL sa code para mag-auto sync!";
        return;
    }

    if (statusDiv) statusDiv.innerHTML = "⚡ Sending to Google Sheets...";

    // Ihanda ang link kasama ang data
    var fullUrl = `${GOOGLE_SCRIPT_URL}?name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;

    // I-send ang data nang patago (background process)
    fetch(fullUrl)
        .then(response => {
            if (statusDiv) statusDiv.innerHTML = "✅ Live Synced to Teacher's Sheet!";
        })
        .catch(error => {
            if (statusDiv) statusDiv.innerHTML = "⚠️ Saved locally (Offline mode)";
            console.error("Error sending to sheets:", error);
        });
}

// ==========================================
// 7. ON SCAN SUCCESS (KAPAG MAY NA-SCAN)
// ==========================================
function onScanSuccess(decodedText) {
    checkAutoReset(); // I-check ulit ang araw bago mag-save

    var scannedValue = String(decodedText).trim();
    var today = new Date().toLocaleDateString();
    var currentTime = new Date().toLocaleTimeString();

    // Check kung na-scan na siya ngayong araw para iwas doble
    var alreadyScanned = scanHistory.some(item => String(item.name).trim() === scannedValue && item.date === today);

    if (alreadyScanned) {
        alert("⚠️ Na-scan na ang QR code na ito ngayong araw!");
    } else {
        // I-save sa Local Storage (Para sa screen view)
        var record = { name: scannedValue, date: today, time: currentTime };
        scanHistory.push(record);
        localStorage.setItem("myScans", JSON.stringify(scanHistory));
        updateUI();

        // 🚀 AUTOMATIC NA IPASA SA GOOGLE SHEETS!
        sendToGoogleSheets(scannedValue, today, currentTime);
    }

    // I-pause ang camera at ilabas ang "Scan Next" button
    scanner.pause(true);
    var scanBtn = document.getElementById("scanAgainBtn");
    if (scanBtn) scanBtn.style.display = "inline-block";
}

// ==========================================
// 8. INITIALIZE BUTTONS & RENDER SCANNER
// ==========================================

// Pag-render ng camera
scanner.render(onScanSuccess);

// Button para mag-scan ulit
var scanAgainBtn = document.getElementById("scanAgainBtn");
if (scanAgainBtn) {
    scanAgainBtn.onclick = function() {
        scanner.resume(); // I-play ulit ang camera
        scanAgainBtn.style.display = "none";
        var statusDiv = document.getElementById("status");
        if (statusDiv) statusDiv.innerHTML = "";
    };
}

// Button para burahin ang records sa screen
var deleteBtn = document.getElementById("deleteBtn");
if (deleteBtn) {
    deleteBtn.onclick = function() {
        if (confirm("Sigurado ka bang lilinisin ang screen view? (Hindi mabubura ang nasa Google Sheets)")) {
            localStorage.removeItem("myScans");
            scanHistory = [];
            updateUI();
            var statusDiv = document.getElementById("status");
            if (statusDiv) statusDiv.innerHTML = "";
        }
    };
}

// I-load ang mga naka-save na scans sa table pagkabukas
updateUI();
