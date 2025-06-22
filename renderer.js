const fs = require('fs');
const path = require('path');

window.saveBillToDisk = function(billData) {
  const dir = "D:/restaurant_bills";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileName = `bill_${Date.now()}.json`;
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(billData, null, 2));
};

let itemsList = [];

document.addEventListener("DOMContentLoaded", () => {
  // Load item list from Flask backend
  fetch("http://localhost:5000/get-items")
    .then(res => res.json())
    .then(data => itemsList = data);

  const searchInput = document.getElementById("itemSearch");
  const suggestionBox = document.getElementById("suggestions");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    suggestionBox.innerHTML = "";

    if (!query) return;

    const matches = itemsList.filter(item => item.name.toLowerCase().includes(query));
    matches.forEach(item => {
      const div = document.createElement("div");
      div.textContent = `${item.name} (${item.category}) - ₹${item.price}`;
      div.onclick = () => {
        addItemToTable(item);
        searchInput.value = "";
        suggestionBox.innerHTML = "";
      };
      suggestionBox.appendChild(div);
    });
  });

  document.addEventListener("click", (e) => {
    if (!suggestionBox.contains(e.target) && e.target !== searchInput) {
      suggestionBox.innerHTML = "";
    }
  });
});

function addItemToTable(item) {
  const tbody = document.getElementById("foodItemsBody");

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.name}</td>
    <td>${item.category}</td>
    <td>${item.price}</td>
    <td><input type="number" value="1" min="1" onchange="updateTotal()"></td>
    <td><input type="text" placeholder="Optional remarks"></td>
  `;

  tbody.appendChild(row);
  updateTotal();
}

function updateTotal() {
  let total = 0;
  const rows = document.querySelectorAll("#foodItemsBody tr");

  rows.forEach(row => {
    const price = parseFloat(row.cells[2].textContent);
    const qty = parseFloat(row.cells[3].querySelector("input").value);
    total += price * qty;
  });

  document.getElementById("total").textContent = total.toFixed(2);
}

function saveBill() {
  const customerName = document.getElementById("customerName").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();
  const paidAmount = parseFloat(document.getElementById("paid").value || 0);
  const total = parseFloat(document.getElementById("total").textContent);
  const tableNumber = document.getElementById("tableNumber").value.trim();
  const rows = document.querySelectorAll("#foodItemsBody tr");

  if (!customerName || !customerPhone) {
    document.getElementById("status").textContent = "❌ Please fill in all fields.";
    return;
  }

  const items = Array.from(rows).map(row => ({
    name: row.cells[0].textContent,
    category: row.cells[1].textContent,
    price: parseFloat(row.cells[2].textContent),
    quantity: parseFloat(row.cells[3].querySelector("input").value),
    remarks: row.cells[4].querySelector("input").value.trim()
  }));

  const bill = {
    customerName,
    customerPhone,
    tableNumber,
    items,
    total,
    paidAmount,
    date: new Date().toISOString()
  };

  // Save via Flask
  fetch("http://localhost:5000/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bill)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById("status").textContent = "✅ Bill saved successfully!";
      
      // Call Electron print function
      localStorage.setItem("printBill", JSON.stringify(bill));  // Pass data
      window.printBill();
    } else {
      document.getElementById("status").textContent = "❌ Failed to save.";
    }
  })
  .catch(err => {
    document.getElementById("status").textContent = "❌ Server error: " + err.message;
  });
    ipcRenderer.invoke('open-bill-preview', bill);
}

window.printBill = function () {
  const { ipcRenderer } = require('electron');
  ipcRenderer.invoke('print-bill');
};
window.saveBillToDisk = function(billData) {
  const dir = "D:/restaurant_bills";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fileName = `bill_${Date.now()}.json`;
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(billData, null, 2));
    };

    const { ipcRenderer } = require('electron');

ipcRenderer.on('print-result', (event, result) => {
  if (result.success) {
    document.getElementById("status").textContent = "🖨️ Bill printed successfully!";
  } else {
    document.getElementById("status").textContent = `❌ Print failed: ${result.error || "Unknown error"}`;
  }
});

