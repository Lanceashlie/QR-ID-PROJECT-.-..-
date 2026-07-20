// 1. MASTER LIST
const masterList = [
    { id: "1", name: "Ginalyn V. Garcia" },
    { id: "2", name: "Ashlie Luis Hurtada" },
    { id: "3", name: "Shiela Mae D. Garcia" },
    { id: "4", name: "justine lee balingue" }
];

// 2. Load data
let scanHistory = JSON.parse(localStorage.getItem("myScans")) || [];
const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });

// 3. MAIN LOGIC
function updateAttendance() {
    const today = new Date().toLocaleDateString();
    const tbody = document.getElementById("historyBody");
    const absentBody = document.getElementById("absentBody");
    
    tbody.innerHTML = "";
    absentBody.innerHTML = "";

    // Kunin ang mga nag-scan ngayong araw
    const todayScans = scanHistory.filter(item => item.date === today);
    const scannedIDs = todayScans.map(item => item.id.toString());

    // I-display ang Present
    todayScans.forEach((item, i) => {
        tbody.innerHTML += `<tr><td>${i + 1}</td><td>${item.id}</td><td>${item.time}</td></tr>`;
    });

    // Check deadline (8:55 AM)
    const now = new Date();
    const isPastDeadline = (now.getHours() > 8) || (now.getHours() === 8 && now.getMinutes() >= 55);

    // I-display ang Absent (Kapag nag-scan sila, mawawala sila dito kahit late)
    masterList.forEach(student => {
        if (!scannedIDs.includes(student.id.toString())) {
            let style = isPastDeadline ? 'style="background-color: #ff4444; color: white;"' : '';
            absentBody.innerHTML += `<tr ${style}><td>${student.id}</td><td>${student.name}</td></tr>`;
        }
    });

    if (document.getElementById("countDisplay")) {
        document.getElementById("countDisplay").innerText = todayScans.length + " / " + masterList.length;
    }
}

// 4. SCAN SUCCESS
function onScanSuccess(decodedText) {
    const today = new Date().toLocaleDateString();
    
    // Check kung na-scan na
    if (scanHistory.some(i => i.id.toString() === decodedText.toString() && i.date === today)) {
        alert("Na-scan na ang estudyanteng ito ngayong araw!");
    } else {
        scanHistory.push({ 
            id: decodedText, 
            time: new Date().toLocaleTimeString(), 
            date: today 
        });
        localStorage.setItem("myScans", JSON.stringify(scanHistory));
        updateAttendance();
    }
    
    scanner.pause(true);
    document.getElementById("scanAgainBtn").style.display = "inline-block";
}

// 5. INITIALIZE
scanner.render(onScanSuccess);

// 6. BUTTONS
document.getElementById("scanAgainBtn").onclick = () => {
    scanner.resume();
    document.getElementById("scanAgainBtn").style.display = "none";
};

document.getElementById("deleteBtn").onclick = () => {
    if (confirm("Burahin ang lahat ng records?")) {
        scanHistory = [];
        localStorage.removeItem("myScans");
        updateAttendance();
    }
};

document.getElementById("downloadBtn").onclick = () => {
    let csv = "ID,Time,Date\n" + scanHistory.map(i => `${i.id},${i.time},${i.date}`).join("\n");
    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = "Attendance_List.csv";
    a.click();
};

// Initial Call
updateAttendance();
