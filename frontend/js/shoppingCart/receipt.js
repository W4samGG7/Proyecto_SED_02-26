const money = (value) => `$${Number(value).toFixed(2)}`;

function formatReceiptNumber(id) {
  return `F-${String(id).padStart(6, "0")}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("es", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function getOrderId() {
  return new URLSearchParams(window.location.search).get("id");
}

async function fetchOrder(id) {
  const response = await fetch(`/api/pedidos/${encodeURIComponent(id)}`);

  if (response.status === 401) {
    goToLogin();
    return undefined;
  }
  if (response.status === 400 || response.status === 404) return null;
  if (!response.ok) throw new Error("No se pudo cargar la factura");

  return response.json();
}

function renderMessage(text) {
  document.getElementById("receipt-content").innerHTML = `
    <div class="receipt-message">
      <p>${escapeHTML(text)}</p>
      <a href="../../index.html" class="receipt-btn">Volver al inicio</a>
    </div>`;
}

function renderReceipt(order) {
  const number = formatReceiptNumber(order.id);
  const envio = Number(order.envio);
  const impuesto = Number(order.impuesto);

  const rows = order.items
    .map((item) => {
      const subtotal = Number(item.precio_unitario) * item.cantidad;
      const meta = [item.marca, item.talla ? `Talla ${item.talla}` : ""]
        .filter(Boolean)
        .map(escapeHTML)
        .join(" · ");

      return `
        <tr>
          <td>
            <span class="item-name">${escapeHTML(item.nombre)}</span>
            ${meta ? `<span class="item-meta">${meta}</span>` : ""}
          </td>
          <td class="num">${item.cantidad}</td>
          <td class="num">${money(item.precio_unitario)}</td>
          <td class="num">${money(subtotal)}</td>
        </tr>`;
    })
    .join("");

  document.title = `Factura ${number}`;

  document.getElementById("receipt-content").innerHTML = `
    <p class="receipt-thanks no-print">¡Gracias por tu compra! Aquí tienes tu factura.</p>

    <article class="receipt">
      <header class="receipt-header">
        <div>
          <h1>Factura</h1>
          <p class="receipt-number">N.º ${number}</p>
        </div>
        <div class="receipt-meta">
          <span>Fecha: ${escapeHTML(formatDate(order.fecha))}</span>
          <span>Estado: ${escapeHTML(order.estado)}</span>
        </div>
      </header>

      <section class="receipt-customer">
        <h2>Cliente</h2>
        <p>${escapeHTML(order.cliente_nombre)}</p>
        <p>${escapeHTML(order.cliente_correo)}</p>
        <p>Envío a: ${escapeHTML(order.direccion_envio)}</p>
      </section>

      <div class="receipt-table-wrap">
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th class="num">Cant.</th>
              <th class="num">Precio</th>
              <th class="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <section class="receipt-totals">
        <div class="totals-row"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
        ${envio > 0 ? `<div class="totals-row"><span>Envío</span><span>${money(envio)}</span></div>` : ""}
        ${impuesto > 0 ? `<div class="totals-row"><span>Impuestos</span><span>${money(impuesto)}</span></div>` : ""}
        <div class="totals-row grand"><span>Total</span><span>${money(order.total)}</span></div>
      </section>
    </article>

    <div class="receipt-actions no-print">
      <button type="button" class="receipt-btn" id="print-btn">Imprimir / Guardar PDF</button>
      <a href="../../index.html" class="receipt-link">Seguir comprando</a>
    </div>
  `;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#print-btn")) window.print();
});

document.addEventListener("DOMContentLoaded", async () => {
  const id = getOrderId();
  if (!id) {
    renderMessage("No encontramos esta factura.");
    return;
  }

  try {
    const order = await fetchOrder(id);
    if (order === undefined) return; // redirigiendo al login
    if (order === null) {
      renderMessage("No encontramos esta factura.");
      return;
    }
    renderReceipt(order);
  } catch (error) {
    console.error(error);
    renderMessage("No se pudo cargar la factura. Inténtalo de nuevo en unos minutos.");
  }
});