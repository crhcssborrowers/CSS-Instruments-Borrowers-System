// =======================
// ACCOUNTS & CONFIG
// =======================
const accounts = [
    { username: "CSS", password: "css@012", role: "admin" },
    { username: "CSS", password: "css@012", role: "viewer" }
];

let loggedInUser = localStorage.getItem("loggedInUser");
const OVERDUE_LIMIT = 2 * 24 * 60 * 60 * 1000;
const equipmentInput = document.getElementById("equipment-select"); 
const barcodeSelect = document.getElementById("barcode-select");

// =======================
// DATA STORAGE
// =======================
let borrowList = JSON.parse(localStorage.getItem("borrowList")) || [];
let areaList = JSON.parse(localStorage.getItem("areaList")) || ["DR", "ER", "WARD 1", "WARD 2", "OR"];
let detailedStock = JSON.parse(localStorage.getItem("detailedStock")) || {};

const initialStock = {
    "Alligator Forcep": 1, "Alus Forcep": 1, "Bobcock Forcep": 4, "Blade Holder": 2,
    "Bonecurette": 1, "Bone Ronguer": 1, "CTT Set": 5, "Cutdown": 3, "Cutting Needles": 3,
    "Enema Can": 6, "Hemostatic Curve": 1, "Hemostatic Straight": 2, "Minor Set": 6,
    "Kelly Straight": 4, "Mayo Scissors Soaked": 3, "Metz Scissors Soaked": 7,
    "Mosquito Curve": 2, "Needle Holder Gold": 1, "Needle Holder Small": 1,
    "Needle Holder Medium": 1, "Needle Holder Large": 1, "Ovum Forcep": 5,
    "Skin Retractor": 2, "Stainless Kidney Basin": 5, "Suture Remover Soaked": 4,
    "Vaginal Speculum Large": 1, "Vaginal Speculum Small": 2, "Suturing Set": 5,
    "Red Ribbon": 1, "Infectious Minor Set": 2, "Infectious CTT Set": 2,
    "Infectious Kidney Basin": 2, "Needle Holder Long/Straight": 1,
    "Needle Holder Long/Curve": 1, "Pean Straight": 1, "Pean Curve": 1,
    "Bayonet forcep Long": 2, "Bayonet forcep Small": 2, "Nasal Speculum": 2,
    "Tissue forcep w/ Teeth": 4, "Long Nose": 2
};

if (Object.keys(detailedStock).length === 0) {
    for (let name in initialStock) {
        detailedStock[name] = [];
        for (let i = 0; i < initialStock[name]; i++) {
            detailedStock[name].push({ barcode: "", expiry: "", status: "available" });
        }
    }
}

function saveAll() {
    localStorage.setItem("borrowList", JSON.stringify(borrowList));
    localStorage.setItem("detailedStock", JSON.stringify(detailedStock));
    localStorage.setItem("areaList", JSON.stringify(areaList));
}

// =======================
// SYNC HELPERS (DROPDOWNS)
// =======================
function syncInstrumentDropdown() {
    const datalist = document.getElementById("instrument-list");
    if (!datalist) return;
    datalist.innerHTML = "";
    Object.keys(detailedStock).sort().forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        datalist.appendChild(option);
    });
}

function syncAreaDropdown() {
    const areaSelect = document.getElementById("area-select");
    if (!areaSelect) return;
    areaSelect.innerHTML = '<option value="">Select Area</option>';
    areaList.sort().forEach(area => {
        const opt = document.createElement("option");
        opt.value = area;
        opt.textContent = area;
        areaSelect.appendChild(opt);
    });
}

function updateYearOptions() {
    const yearFilter = document.getElementById("year-filter");
    if (!yearFilter) return;
    const currentYear = new Date().getFullYear();
    yearFilter.innerHTML = '<option value="all">All Years</option>';
    for (let year = 2024; year <= 2040; year++) {
        const opt = document.createElement("option");
        opt.value = year;
        opt.textContent = year;
        yearFilter.appendChild(opt);
    }
}

// =======================
// AREA MANAGEMENT
// =======================
function openAddAreaModal() { document.getElementById("area-add-modal")?.classList.remove("hidden"); }
function closeAreaModal(id) { document.getElementById(id)?.classList.add("hidden"); }

function saveNewArea() {
    const nameInput = document.getElementById("new-area-name");
    const name = nameInput.value.trim().toUpperCase();
    
    if (!name) return;
    
    if (areaList.includes(name)) { 
        Swal.fire({
            title: 'Error',
            text: 'Area already exists!',
            icon: 'error',
            target: 'body'
        }); 
        return; 
    }
    
    areaList.push(name);
    saveAll();
    syncAreaDropdown();
    closeAreaModal('area-add-modal');
    nameInput.value = "";

    // SUCCESS MESSAGE NGA NAY GREEN NGA OK BUTTON
    Swal.fire({
        title: 'Success',
        text: 'Area added successfully!',
        icon: 'success',
        confirmButtonColor: '#39FF14', // Neon Green color
        target: 'body'
    });
}

function openDeleteAreaModal() {
    const listContainer = document.getElementById("area-delete-list");
    if (!listContainer) return;

    listContainer.innerHTML = ""; 
    // Gi-usab gikan sa "areas" ngadto sa "areaList"
    const sortedAreas = [...areaList].sort(); 

    sortedAreas.forEach(area => {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; margin-bottom: 8px; border: 2px solid #39FF14; border-radius: 8px; font-weight: bold; background: white; position: relative;";

        row.innerHTML = `
            <span style="flex: 1; text-align: left;">${area}</span>
            <button onclick="confirmDeleteArea('${area}')" 
                style="background-color: #ff0000; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; position: relative; z-index: 20;">
                Delete
            </button>
        `;
        listContainer.appendChild(row);
    });

    document.getElementById("area-delete-modal").classList.remove("hidden");
}
function confirmDeleteArea(areaName) {
    Swal.fire({
        title: 'Delete Area?',
        text: `Are you sure you want to remove "${areaName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        target: 'body'
    }).then((result) => {
        if (result.isConfirmed) {
            // SAKTO NGA LOGIC: areaList ang gamiton, dili areas
            areaList = areaList.filter(a => a !== areaName);
            
            saveAll(); // Gi-save na sa localStorage
            loadAll(); // Gi-update na ang tanan dropdowns/tables
            openDeleteAreaModal(); // Gi-refresh ang listahan sa modal

            // SUCCESS MESSAGE (Imong gusto nga resulta)
            Swal.fire({
                title: 'Deleted!',
                text: 'The area has been deleted in the list.',
                icon: 'success',
                confirmButtonColor: '#39FF14',
                target: 'body'
            });
        }
    });
}

// =======================
// LOGIN / LOGOUT
// =======================
document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = accounts.find(a => a.username === document.getElementById("username").value.trim() && a.password === document.getElementById("password").value.trim());
    if (!user) { document.getElementById("error-msg").textContent = "Invalid login!"; return; }
    localStorage.setItem("loggedInUser", user.username);
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("dashboard-page").classList.remove("hidden");
    loadAll();
});

function logout() {
    localStorage.removeItem("loggedInUser");
    location.reload();
}
document.getElementById("logout-btn")?.addEventListener("click", logout);

// =======================
// BORROW & RETURN LOGIC
// =======================
function updateBarcodes(name) {
    if (!barcodeSelect) return;
    barcodeSelect.innerHTML = '<option value="">Select Barcode & Expiry</option>';
    if (!detailedStock[name]) return;
    const available = detailedStock[name].filter(u => u.status === "available");
    if (available.length === 0) {
        barcodeSelect.innerHTML = '<option value="">⚠️ OUT OF STOCK</option>';
    } else {
        available.forEach(unit => {
            const opt = document.createElement("option");
            opt.value = unit.barcode || "No Barcode"; 
            const bCode = unit.barcode || "No Barcode Set";
            const expDate = unit.expiry ? `(Exp: ${unit.expiry})` : "(No Expiry)";
            opt.textContent = `${bCode} ${expDate}`;
            barcodeSelect.appendChild(opt);
        });
    }
}

if (equipmentInput) {
    equipmentInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        // SEARCH AS YOU TYPE ACCURACY: Find first match starting with input
        const match = Object.keys(detailedStock).find(name => name.toLowerCase().startsWith(val.toLowerCase()));
        if (match) updateBarcodes(match);
    });
}

function returnItem(id) {
    const item = borrowList.find(i => i.id === id);
    if (!item || item.returned) return;

    Swal.fire({
        title: 'Return Instrument',
        html: `<p>Receive for: <b>${item.equipment}</b></p>`,
        input: 'text',
        inputPlaceholder: 'Enter receiver name...',
        showCancelButton: true,
        confirmButtonText: 'Confirm Return',
        confirmButtonColor: '#12B9B9',
        inputValidator: (value) => { if (!value) return 'Receiver name is required!' }
    }).then((result) => {
        if (result.isConfirmed) {
            item.returned = true;
            item.returnTime = new Date().toLocaleString();
            item.receivedBy = result.value;
            if (detailedStock[item.equipment]) {
                const unit = detailedStock[item.equipment].find(u => u.barcode === item.barcode);
                if (unit) unit.status = "available";
            }
            saveAll();
            loadAll();

            // SUCCESS POP-UP NGA NAY GREEN BUTTON
            Swal.fire({
                title: 'Returned!',
                text: 'Instrument status updated and returned.',
                icon: 'success',
                confirmButtonColor: '#39FF14', // Neon Green
                target: 'body'
            });
        }
    });
}

// =======================
// VIEW LOADERS (TABLES)
// =======================
function loadMonthly() {
    const tbody = document.querySelector("#monthly-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const selMonth = document.getElementById("month-filter")?.value || "all";
    const selYear = document.getElementById("year-filter")?.value || "all";

    const filtered = borrowList.filter(item => {
        const d = new Date(item.timestamp);
        const mMatch = (selMonth === "all" || d.getMonth().toString() === selMonth);
        const yMatch = (selYear === "all" || d.getFullYear().toString() === selYear);
        return mMatch && yMatch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">No records for ${selMonth}/${selYear}</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.equipment}</td><td>${item.barcode}</td><td>${item.area}</td><td>${item.time}</td><td>${item.issuedBy}</td></tr>`;
    });
}

function loadActive() {
    const tbody = document.querySelector("#borrow-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    borrowList.filter(i => !i.returned).forEach(item => {
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.type}</td><td>${item.equipment}</td><td>${item.barcode}</td><td>${item.area}</td><td>${item.issuedBy}</td><td>${item.time}</td><td><button onclick="returnItem(${item.id})">Return</button></td></tr>`;
    });
}

function loadAvailable() {
    const tbody = document.querySelector("#available-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    for (let name in detailedStock) {
        const items = detailedStock[name];
        const avCount = items.filter(i => i.status === "available").length;
        tbody.innerHTML += `<tr><td>${name}</td><td>${items.length}</td><td>${avCount}</td><td><button onclick="openUnitManager('${name}')">Edit Units</button></td></tr>`;
    }
}

function loadReturned() {
    const tbody = document.querySelector("#returned-table tbody");
    if (!tbody) return; tbody.innerHTML = "";
    borrowList.filter(i => i.returned).forEach(item => {
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.equipment}</td><td>${item.barcode}</td><td>${item.area}</td><td>${item.returnTime}</td><td>${item.receivedBy}</td></tr>`;
    });
}

function loadTotal() {
    const tbody = document.querySelector("#total-table tbody");
    if (!tbody) return; tbody.innerHTML = "";
    borrowList.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.equipment}</td><td>${item.barcode}</td><td>${item.area}</td><td>${item.time}</td><td>${item.issuedBy}</td><td>${item.receivedBy || "-"}</td></tr>`;
    });
}

function loadOverdue() {
    const tbody = document.querySelector("#overdue-table tbody");
    if (!tbody) return; tbody.innerHTML = "";
    const now = Date.now();
    borrowList.filter(i => !i.returned && (now - i.timestamp) > OVERDUE_LIMIT).forEach(item => {
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.equipment}</td><td>${item.barcode}</td><td>${item.area}</td><td>${item.time}</td></tr>`;
    });
}

function loadStats() {
    const now = Date.now();
    
    if(document.getElementById("stat-total")) 
        document.getElementById("stat-total").textContent = borrowList.length;
    
    if(document.getElementById("stat-active")) 
        document.getElementById("stat-active").textContent = borrowList.filter(i => !i.returned).length;
    
    if(document.getElementById("stat-returned")) 
        document.getElementById("stat-returned").textContent = borrowList.filter(i => i.returned).length;

    // MAO NI ANG KULANG: I-update ang Overdue Count sa Dashboard
    if(document.getElementById("stat-overdue")) {
        const overdueCount = borrowList.filter(i => !i.returned && (now - i.timestamp) > OVERDUE_LIMIT).length;
        document.getElementById("stat-overdue").textContent = overdueCount;
    }
}

function loadAll() { loadActive(); loadReturned(); loadTotal(); loadMonthly(); loadAvailable(); loadStats(); loadOverdue(); syncInstrumentDropdown(); syncAreaDropdown(); updateYearOptions(); }

// =======================
// UNIT MANAGEMENT
// =======================
function openUnitManager(name) {
    const items = detailedStock[name];
    let html = `<div id="unit-modal" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:20px; border:2px solid #2c3e50; z-index:9999; width:80%; max-height:80vh; overflow-y:auto; box-shadow: 0 0 20px rgba(0,0,0,0.5);"><h3>Manage ${name}</h3>`;
    items.forEach((item, index) => {
        html += `<div style="margin-bottom:10px; border-bottom:1px solid #eee;">Unit ${index+1}: <input type="text" id="bc-${index}" value="${item.barcode}"> Expiry: <input type="date" id="ex-${index}" value="${item.expiry}"> Status: ${item.status}</div>`;
    });
    html += `<button onclick="saveUnits('${name}')">Save</button> <button onclick="document.getElementById('overlay').remove()">Close</button></div>`;
    const div = document.createElement('div'); div.id="overlay"; div.innerHTML = html; document.body.appendChild(div);
}

function saveUnits(name) {
    detailedStock[name].forEach((item, index) => {
        item.barcode = document.getElementById(`bc-${index}`).value;
        item.expiry = document.getElementById(`ex-${index}`).value;
    });
    saveAll();
    document.getElementById("overlay").remove();
    loadAvailable();
}

// =======================
// NAVIGATION
// =======================
function showView(view) {
    document.querySelectorAll(".main-content > div").forEach(v => v.classList.add("hidden"));
    const target = document.getElementById("view-" + view);
    if (target) target.classList.remove("hidden");
    document.querySelectorAll(".sidebar nav ul li").forEach(li => li.classList.remove("active"));
    const activeNav = document.getElementById("nav-" + (view === 'dashboard' ? 'dash' : view));
    if (activeNav) activeNav.classList.add("active");
}

document.getElementById("nav-dash").onclick = () => showView("dashboard");
document.getElementById("nav-total").onclick = () => showView("total");
document.getElementById("nav-returned").onclick = () => showView("returned");
document.getElementById("nav-overdue").onclick = () => showView("overdue");
document.getElementById("nav-available").onclick = () => showView("available");
document.getElementById("nav-monthly").onclick = () => { showView("monthly"); loadMonthly(); };

// =======================
// INSTRUMENT MODALS
// =======================
function openAddInstrumentModal() { document.getElementById("add-modal").classList.remove("hidden"); }
function closeAddInstrumentModal() { document.getElementById("add-modal").classList.add("hidden"); }

function saveNewInstrument() {
    const name = document.getElementById("new-inst-name").value.trim();
    const stock = parseInt(document.getElementById("new-inst-stock").value);
    
    if (!name || isNaN(stock)) {
        Swal.fire('Error', 'Please enter a valid name and stock count.', 'error');
        return;
    }

    detailedStock[name] = [];
    for (let i = 0; i < stock; i++) {
        detailedStock[name].push({ barcode: "", expiry: "", status: "available" });
    }

    saveAll(); 
    loadAll(); 
    closeAddInstrumentModal();

    // MAO KINI ANG POP-UP NGA NAY GREEN NGA BUTTON
    Swal.fire({
        title: 'Added!',
        text: 'New instrument saved successfully.',
        icon: 'success',
        confirmButtonColor: '#39FF14', // Mao ni ang Neon Green
        target: 'body'
    });
}

function openDeleteModal() {
    const listContainer = document.getElementById("delete-list-container");
    if (!listContainer) return;

    listContainer.innerHTML = ""; 
    const instrumentNames = Object.keys(detailedStock).sort();

    instrumentNames.forEach(name => {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; margin-bottom: 8px; border: 2px solid #39FF14; border-radius: 8px; font-weight: bold; background: white;";

        row.innerHTML = `
            <span style="flex: 1; text-align: left;">${name}</span>
            <button onclick="confirmDeleteInst('${name}')" 
                style="background-color: #ff0000; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; position: relative; z-index: 20;">
                Delete
            </button>
        `;
        listContainer.appendChild(row);
    });

    document.getElementById("delete-modal").classList.remove("hidden");
}
function confirmDeleteInst(name) {
    // 1. MANGUTANA UNA (CONFIRMATION)
    Swal.fire({
        title: 'Delete Instrument?',
        text: `Are you sure you want to remove "${name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Pula para sa Delete
        cancelButtonColor: '#6c757d', // Grey para sa Cancel
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        target: 'body'
    }).then((result) => {
        // 2. KUNG GI-CLICK ANG "YES", DIHA PA SIYA MO-DELETE
        if (result.isConfirmed) {
            
            // LOGIC SA PAG-DELETE
            delete detailedStock[name]; 
            
            // I-save ug i-refresh ang tables/modals
            saveAll();
            loadAll();
            openDeleteModal(); // I-refresh ang listahan sa sulod sa modal

            // 3. SUCCESS MESSAGE (PAREHA NA SA AREA DESIGN)
            Swal.fire({
                title: 'Deleted!',
                text: 'The instrument has been deleted from the inventory.',
                icon: 'success',
                confirmButtonColor: '#39FF14', // Mao ni ang Neon Green nga color
                target: 'body'
            });
        }
    });
}

function closeDeleteModal() { document.getElementById("delete-modal").classList.add("hidden"); }

// =======================
// BORROWING FORM SUBMIT
// =======================
document.getElementById("borrow-form")?.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("borrower-name").value;
    const type = document.getElementById("type-select").value; 
    const equipment = document.getElementById("equipment-select").value;
    const barcode = document.getElementById("barcode-select").value;
    const area = document.getElementById("area-select").value;
    const issuedBy = document.getElementById("issued-by").value;

    if (!barcode || barcode.includes("OUT OF STOCK")) { 
        Swal.fire('Error', 'Invalid selection!', 'error'); 
        return; 
    }

    const newItem = {
        id: Date.now(),
        name,
        type, 
        equipment,
        barcode,
        area,
        issuedBy,
        time: new Date().toLocaleString(),
        timestamp: Date.now(),
        returned: false
    };

    if (detailedStock[equipment]) {
        const unit = detailedStock[equipment].find(u => u.barcode === barcode);
        if (unit) unit.status = "unavailable";
    }

    borrowList.push(newItem);
    saveAll();
    loadAll();
    this.reset();
    
    if(barcodeSelect) barcodeSelect.innerHTML = '<option value="">Select Barcode & Expiry</option>';
    
    // SUCCESS POP-UP NGA NAY GREEN BUTTON
    Swal.fire({
        title: 'Success!',
        text: 'Borrowing recorded successfully.',
        icon: 'success',
        confirmButtonColor: '#39FF14', // Neon Green
        target: 'body'
    });
});

// =======================
// INIT ON LOAD
// =======================
window.addEventListener("load", () => {
    if (localStorage.getItem("loggedInUser")) {
        document.getElementById("login-page").classList.add("hidden");
        document.getElementById("dashboard-page").classList.remove("hidden");
        loadAll();
        // REAL-TIME FILTERS
        document.getElementById("month-filter")?.addEventListener("change", loadMonthly);
        document.getElementById("year-filter")?.addEventListener("change", loadMonthly);
    }
});
// Idugang kini sa pinaka-ubos sa imong script
setInterval(() => {
    loadStats();   // Mo-update sa mga numero sa box
    loadOverdue(); // Mo-update sa table sa overdue view
    console.log("Stats refreshed!"); // Para makita nimo sa console nga nag-andar
}, 10000); // Mag-refresh matag 10 segundos
