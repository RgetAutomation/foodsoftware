// bill.js
const { ipcRenderer } = require('electron');

ipcRenderer.on('bill-data', (event, bill) => {
  const container = document.getElementById("billContainer");

  container.innerHTML = `
    <p><strong>Name:</strong> ${bill.customerName}</p>
    <p><strong>Phone:</strong> ${bill.customerPhone}</p>
    <p><strong>Table:</strong> ${bill.tableNumber}</p>
    <table border="1" style="width: 100%; margin-top: 10px;">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${bill.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price}</td>
            <td>${(item.quantity * item.price).toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p><strong>Total: ₹${bill.total}</strong></p>
    <p><strong>Paid: ₹${bill.paidAmount}</strong></p>
  `;
});

function confirmPrint() {
  ipcRenderer.invoke('print-bill');
}

ipcRenderer.on('print-result', (event, result) => {
  const status = document.getElementById("printStatus");
  if (result.success) {
    status.textContent = "✅ Printed successfully.";
  } else {
    status.textContent = "❌ Print failed: " + result.error;
  }
});
