export default function printReceipt(order) {
  const items = order.items || [];
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Receipt #${order.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; margin: 0; padding: 20px; color: #222; }
        .receipt { max-width: 320px; margin: 0 auto; }
        h1 { text-align: center; font-size: 18px; margin: 0 0 4px; }
        .store { text-align: center; font-size: 11px; color: #666; margin-bottom: 12px; }
        .divider { border-top: 1px dashed #999; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 4px 0; }
        th { border-bottom: 1px solid #999; font-size: 11px; }
        .total { font-weight: bold; font-size: 15px; }
        .paid { color: #16a34a; font-weight: bold; text-align: center; margin-top: 8px; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 12px; }
        @media print { body { margin: 0; padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="receipt">
        <h1>Phone Store</h1>
        <div class="store">#${order.id} | ${new Date(order.created_at).toLocaleDateString()} ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="divider"></div>
        <div class="row"><span>Customer</span><span>${order.name || order.user?.name || "-"}</span></div>
        <div class="row"><span>Phone</span><span>${order.phone || "-"}</span></div>
        <div class="divider"></div>
        <table>
          <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
          <tbody>
            ${items.map(i => `
              <tr>
                <td>${i.product?.name || "Item"}</td>
                <td style="text-align:center">${i.quantity}</td>
                <td style="text-align:right">$${(i.price * i.quantity).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="row total"><span>Total</span><span>$${parseFloat(order.total_price).toFixed(2)}</span></div>
        <div class="row"><span>Payment</span><span>${(order.payment_method || "N/A").toUpperCase()}</span></div>
        <div class="row"><span>Status</span><span>${order.payment_status || "unpaid"}</span></div>
        ${order.payment_status === "paid" ? '<div class="paid">PAID</div>' : ""}
        <div class="footer">Thank you for your order!</div>
      </div>
      <script>window.print();window.close();</script>
    </body>
    </html>
  `);
  win.document.close();
}
