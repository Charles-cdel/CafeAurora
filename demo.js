"use strict";

(() => {
  const STORAGE_KEY = "cafeAuroraDemoV2";
  const DEMO_PRODUCTS = [
    { id: "espresso", name: "Espresso Aurora", category: "CAFÉ CLÁSSICO", description: "Um espresso intenso, com aroma marcante e final aveludado.", price: 8, emoji: "☕" },
    { id: "latte", name: "Latte Dourado", category: "ASSINATURA DA CASA", description: "Espresso delicado com leite vaporizado e uma camada cremosa.", price: 13, emoji: "🥛" },
    { id: "brownie", name: "Brownie Midnight", category: "DOCE MOMENTO", description: "Brownie fictício de chocolate, casquinha crocante e centro macio.", price: 10, emoji: "🍫" }
  ];
  const TABLES = [
    { id: "A1", name: "Mesa A1", seats: 2, area: "Janela" },
    { id: "A2", name: "Mesa A2", seats: 2, area: "Salão" },
    { id: "B1", name: "Mesa B1", seats: 4, area: "Lounge" },
    { id: "B2", name: "Mesa B2", seats: 4, area: "Janela" },
    { id: "C1", name: "Mesa C1", seats: 6, area: "Grupo" },
    { id: "VIP", name: "Mesa Celebração", seats: 6, area: "Aniversários" }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const today = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const plusDays = (dateString, days) => {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const currency = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.reservations) && Array.isArray(saved.clients) && Array.isArray(saved.products)) {
        return saved;
      }
    } catch (error) {
      console.warn("Não foi possível ler os dados locais do protótipo.", error);
    }
    return {
      user: null,
      clients: [
        { id: "c1", name: "Marina Costa", email: "marina@example.test", createdAt: "2026-01-15" },
        { id: "c2", name: "Rafael Lima", email: "rafael@example.test", createdAt: "2026-02-08" },
        { id: "c3", name: "Luiza Martins", email: "luiza@example.test", createdAt: "2026-03-21" }
      ],
      products: DEMO_PRODUCTS.map((product) => ({ ...product })),
      reservations: []
    };
  }

  let state = readState();
  let selectedTable = null;
  let activeAdminTab = "reservas";
  let toastTimer = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Não foi possível salvar os dados locais.", error);
      showToast("O navegador não permitiu salvar os dados desta demonstração.");
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function renderProducts() {
    $("#product-grid").innerHTML = state.products.map((product, index) => `
      <article class="product-card">
        <div class="product-art"><span class="product-number">AURORA / 0${index + 1}</span><span class="product-emoji" aria-hidden="true">${product.emoji}</span></div>
        <div class="product-body">
          <span class="product-type">${escapeHTML(product.category)}</span>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description)}</p>
          <div class="product-bottom"><span class="product-price">${currency(Number(product.price))}</span><button type="button" data-product-interest="${escapeHTML(product.id)}">Tenho interesse ↗</button></div>
        </div>
      </article>
    `).join("");
  }

  function initializeDateAndTimes() {
    const dateInput = $("#booking-date");
    dateInput.min = today();
    dateInput.value = today();
    const select = $("#booking-time");
    select.innerHTML = '<option value="">Escolha um horário</option>';
    for (let hour = 16; hour <= 21; hour++) {
      for (const minute of ["00", "30"]) {
        if (hour === 21 && minute === "30") continue;
        const value = `${String(hour).padStart(2, "0")}:${minute}`;
        select.insertAdjacentHTML("beforeend", `<option value="${value}">${value}</option>`);
      }
    }
  }

  function getBookingDetails() {
    return {
      date: $("#booking-date").value,
      time: $("#booking-time").value,
      guests: Number($("#booking-guests").value),
      occasion: $("#booking-occasion").value
    };
  }

  function slotOverlaps(existing, date, time) {
    if (existing.date !== date || existing.status === "cancelada") return false;
    const startA = timeToMinutes(existing.time);
    const startB = timeToMinutes(time);
    return startA < startB + 120 && startB < startA + 120;
  }

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function isPastSlot(date, time) {
    const slotDate = new Date(`${date}T${time}:00`);
    return slotDate.getTime() < Date.now();
  }

  function availableTables(details) {
    if (!details.date || !details.time || isPastSlot(details.date, details.time)) return [];
    return TABLES.filter((table) => {
      if (table.seats < details.guests) return false;
      if (details.occasion === "Aniversário" && table.id !== "VIP" && table.seats < details.guests) return false;
      return !state.reservations.some((reservation) =>
        reservation.tableId === table.id &&
        slotOverlaps(reservation, details.date, details.time)
      );
    });
  }

  function renderTables() {
    const details = getBookingDetails();
    const list = $("#table-list");
    const count = $("#availability-count");
    const summary = $("#booking-summary");
    const options = availableTables(details);
    const isSlotChosen = Boolean(details.date && details.time);

    if (!isSlotChosen) {
      list.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><p>Escolha uma data e um horário para consultar as mesas.</p></div>';
      count.textContent = "Aguardando data e horário";
      selectedTable = null;
      summary.innerHTML = '<span>Selecione uma mesa para continuar.</span><strong>02:00 h</strong>';
      return;
    }
    if (isPastSlot(details.date, details.time)) {
      list.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><p>Esse horário já passou. Escolha um horário futuro.</p></div>';
      count.textContent = "Horário indisponível";
      selectedTable = null;
      summary.innerHTML = '<span>Escolha um horário futuro.</span><strong>02:00 h</strong>';
      return;
    }

    count.textContent = `${options.length} mesa(s) disponível(is)`;
    if (!options.some((table) => table.id === selectedTable)) selectedTable = null;
    list.innerHTML = TABLES.filter((table) => table.seats >= details.guests).map((table) => {
      const available = options.some((option) => option.id === table.id);
      const selected = selectedTable === table.id && available;
      return `<button class="table-option ${selected ? "selected" : ""}" type="button" data-table-id="${table.id}" ${available ? "" : "disabled"} aria-pressed="${selected}">
        <span class="table-symbol">${table.id === "VIP" ? "✧" : "▦"}</span>
        <span class="table-description"><strong>${escapeHTML(table.name)}</strong><small>${table.seats} lugares · ${escapeHTML(table.area)}</small></span>
        <span class="table-state ${available ? "" : "busy"}">${available ? (selected ? "SELECIONADA" : "LIVRE") : "INDISPONÍVEL"}</span>
      </button>`;
    }).join("");

    const chosen = TABLES.find((table) => table.id === selectedTable);
    summary.innerHTML = chosen
      ? `<span>${escapeHTML(chosen.name)} · ${escapeHTML(details.date)} às ${escapeHTML(details.time)}</span><strong>02:00 h</strong>`
      : '<span>Selecione uma mesa para continuar.</span><strong>02:00 h</strong>';
  }

  function renderAccount() {
    const panel = $("#account-panel");
    if (!state.user) {
      panel.innerHTML = `<div class="empty-state"><div class="empty-icon">✦</div><h3>Seu próximo momento começa aqui.</h3><p>Entre no modo demonstração para acompanhar reservas e experimentar o cancelamento de uma reserva.</p><button class="button button-gold" id="empty-login">Entrar na demonstração ↗</button></div>`;
      return;
    }
    const mine = state.reservations.filter((reservation) => reservation.clientId === state.user.id && reservation.status !== "cancelada")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    panel.innerHTML = `<div style="padding:20px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><span class="eyebrow" style="margin-bottom:4px">OLÁ, ${escapeHTML(state.user.name.toUpperCase())}</span><p style="font-size:11px;color:var(--muted)">Aqui estão suas próximas experiências.</p></div><button class="button button-ghost button-small" id="logout-button">Sair</button></div>
      ${mine.length ? `<div class="reservation-list">${mine.map((reservation) => `<article class="reservation-item"><div><h3>${escapeHTML(reservation.tableName)} · ${escapeHTML(reservation.occasion)}</h3><p>${escapeHTML(reservation.date)} às ${escapeHTML(reservation.time)} · ${reservation.guests} pessoa(s) · 2 horas</p></div><div class="reservation-item-actions"><span class="status-pill">Confirmada</span><button class="small-danger" data-cancel-reservation="${escapeHTML(reservation.id)}">Cancelar</button></div></article>`).join("")}</div>` : `<div class="empty-state"><div class="empty-icon">☾</div><h3>Nenhuma reserva ativa por enquanto.</h3><p>Escolha uma mesa e planeje sua próxima visita ao Café Aurora.</p><a class="button button-gold" href="#reservar">Reservar mesa ↗</a></div>`}`;
  }

  function renderDashboard() {
    const active = state.reservations.filter((reservation) => reservation.status !== "cancelada");
    const todayReservations = active.filter((reservation) => reservation.date === today()).length;
    const uniqueClients = new Set(active.map((reservation) => reservation.clientId)).size;
    const occupiedTables = new Set(active.filter((reservation) => reservation.date === today()).map((reservation) => reservation.tableId)).size;
    const stats = [
      { label: "Reservas ativas", value: active.length, foot: "Todas as datas" },
      { label: "Reservas de hoje", value: todayReservations, foot: "Data local do dispositivo" },
      { label: "Clientes com reserva", value: uniqueClients, foot: "Clientes únicos" },
      { label: "Mesas ocupadas hoje", value: `${occupiedTables}/${TABLES.length}`, foot: "Considera reservas do dia" }
    ];
    $("#dashboard-grid").innerHTML = stats.map((stat) => `<article class="stat-card"><div class="stat-label">${stat.label}</div><div class="stat-value">${stat.value}</div><div class="stat-foot">${stat.foot}</div></article>`).join("");
  }

  function renderAdminContent() {
    const content = $("#admin-content");
    if (activeAdminTab === "reservas") {
      const items = [...state.reservations].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      content.innerHTML = items.length ? `<table class="admin-table"><thead><tr><th>CLIENTE</th><th>DATA / HORA</th><th>MESA</th><th>GRUPO</th><th>STATUS</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHTML(item.clientName)}</td><td>${escapeHTML(item.date)} · ${escapeHTML(item.time)}</td><td>${escapeHTML(item.tableName)}</td><td>${item.guests} pessoa(s) · ${escapeHTML(item.occasion)}</td><td><span class="status-pill" style="${item.status === "cancelada" ? "color:var(--red);border-color:#6d3e3e" : ""}">${item.status === "cancelada" ? "Cancelada" : "Confirmada"}</span></td></tr>`).join("")}</tbody></table>` : '<div class="empty-state"><h3>Ainda não há reservas.</h3><p>As reservas criadas no protótipo aparecerão aqui.</p></div>';
    } else if (activeAdminTab === "clientes") {
      content.innerHTML = `<table class="admin-table"><thead><tr><th>NOME</th><th>E-MAIL FICTÍCIO</th><th>CADASTRO</th><th>RESERVAS ATIVAS</th></tr></thead><tbody>${state.clients.map((client) => {
        const count = state.reservations.filter((reservation) => reservation.clientId === client.id && reservation.status !== "cancelada").length;
        return `<tr><td>${escapeHTML(client.name)}</td><td>${escapeHTML(client.email)}</td><td>${escapeHTML(client.createdAt)}</td><td>${count}</td></tr>`;
      }).join("")}</tbody></table>`;
    } else {
      content.innerHTML = `<table class="admin-table"><thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>PREÇO ILUSTRATIVO</th><th>AÇÃO</th></tr></thead><tbody>${state.products.map((product) => `<tr><td><div class="admin-menu-item"><span>${product.emoji}</span><span>${escapeHTML(product.name)}<small>${escapeHTML(product.description)}</small></span></div></td><td>${escapeHTML(product.category)}</td><td>${currency(Number(product.price))}</td><td><button class="button button-ghost button-small" data-edit-product="${escapeHTML(product.id)}">Editar preço</button></td></tr>`).join("")}</tbody></table>`;
    }
  }

  function renderAdmin() {
    renderDashboard();
    $$(".admin-tab").forEach((button) => {
      const active = button.dataset.adminTab === activeAdminTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderAdminContent();
  }

  function renderAll() {
    renderProducts();
    renderTables();
    renderAccount();
    renderAdmin();
  }

  function setBookingMessage(message, isError = false) {
    const target = $("#booking-message");
    target.textContent = message;
    target.classList.toggle("error", isError);
  }

  function openLogin() {
    const dialog = $("#login-dialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else showToast("Seu navegador não oferece a janela de login deste protótipo.");
    $("#login-name").value = state.user?.name || "";
    $("#login-role").value = state.user?.role || "cliente";
  }

  function loginDemo(name, role) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const email = `${cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "cliente"}@demo.example`;
    let client = state.clients.find((item) => item.name.toLowerCase() === cleanName.toLowerCase());
    if (!client) {
      client = { id: `client-${Date.now()}`, name: cleanName, email, createdAt: today() };
      state.clients.push(client);
    }
    state.user = { id: client.id, name: client.name, role };
    saveState();
    renderAll();
    $("#login-dialog").close();
    showToast(role === "admin" ? "Perfil de demonstração: administrador selecionado." : `Bem-vindo(a), ${cleanName}!`);
    if (role === "admin") $("#admin").scrollIntoView({ behavior: "smooth" });
  }

  function cancelReservation(id) {
    const reservation = state.reservations.find((item) => item.id === id);
    if (!reservation || reservation.status === "cancelada") return;
    if (!window.confirm(`Cancelar a reserva de ${reservation.tableName} em ${reservation.date} às ${reservation.time}?`)) return;
    reservation.status = "cancelada";
    saveState();
    renderAll();
    showToast("Reserva cancelada nesta demonstração.");
  }

  function makeReservation(event) {
    event.preventDefault();
    setBookingMessage("");
    if (!state.user) {
      showToast("Entre na demonstração antes de confirmar sua reserva.");
      openLogin();
      return;
    }
    if (state.user.role !== "cliente") {
      setBookingMessage("Troque para o perfil Cliente para criar uma reserva.", true);
      return;
    }
    const details = getBookingDetails();
    if (!details.date || !details.time || !selectedTable) {
      setBookingMessage("Selecione data, horário e uma mesa disponível.", true);
      return;
    }
    if (isPastSlot(details.date, details.time)) {
      setBookingMessage("Escolha um horário futuro.", true);
      renderTables();
      return;
    }
    const table = TABLES.find((item) => item.id === selectedTable);
    if (!table || !availableTables(details).some((item) => item.id === table.id)) {
      selectedTable = null;
      renderTables();
      setBookingMessage("Essa mesa não está mais disponível. Selecione outra.", true);
      return;
    }
    const reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientId: state.user.id,
      clientName: state.user.name,
      date: details.date,
      time: details.time,
      guests: details.guests,
      occasion: details.occasion,
      tableId: table.id,
      tableName: table.name,
      status: "confirmada",
      durationMinutes: 120,
      createdAt: new Date().toISOString()
    };
    state.reservations.push(reservation);
    saveState();
    selectedTable = null;
    renderAll();
    setBookingMessage(`Reserva confirmada para ${reservation.date} às ${reservation.time}, na ${reservation.tableName}.`);
    showToast("Reserva confirmada por 2 horas!");
    $("#minha-conta").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("click", (event) => {
    const loginButton = event.target.closest("#open-login, #account-login, #empty-login");
    if (loginButton) openLogin();

    const tableButton = event.target.closest("[data-table-id]");
    if (tableButton && !tableButton.disabled) {
      selectedTable = tableButton.dataset.tableId;
      renderTables();
    }

    const cancelButton = event.target.closest("[data-cancel-reservation]");
    if (cancelButton) cancelReservation(cancelButton.dataset.cancelReservation);

    const adminTab = event.target.closest("[data-admin-tab]");
    if (adminTab) {
      activeAdminTab = adminTab.dataset.adminTab;
      renderAdmin();
    }

    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) {
      const product = state.products.find((item) => item.id === editButton.dataset.editProduct);
      if (!product) return;
      const answer = window.prompt(`Novo preço ilustrativo para ${product.name} (use ponto ou vírgula):`, String(product.price).replace(".", ","));
      if (answer === null) return;
      const price = Number(answer.trim().replace(",", "."));
      if (!Number.isFinite(price) || price < 0 || price > 100000) {
        showToast("Digite um preço válido para a demonstração.");
        return;
      }
      product.price = Math.round(price * 100) / 100;
      saveState();
      renderAll();
      showToast("Preço ilustrativo atualizado.");
    }

    const productInterest = event.target.closest("[data-product-interest]");
    if (productInterest) {
      const product = state.products.find((item) => item.id === productInterest.dataset.productInterest);
      showToast(`${product ? product.name : "Produto"}: item demonstrativo, sem venda ou pagamento.`);
    }
  });

  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    loginDemo($("#login-name").value, $("#login-role").value);
  });
  $("#booking-form").addEventListener("submit", makeReservation);

  ["booking-date", "booking-time", "booking-guests", "booking-occasion"].forEach((id) => {
    $(`#${id}`).addEventListener("change", () => {
      selectedTable = null;
      renderTables();
      setBookingMessage("");
    });
  });

  $("#logout-button")?.addEventListener("click", () => {
    state.user = null;
    saveState();
    renderAll();
    showToast("Você saiu do modo demonstração.");
  });

  $("#mobile-menu").addEventListener("click", () => {
    const nav = $("#main-nav");
    const isOpen = nav.classList.toggle("open");
    $("#mobile-menu").setAttribute("aria-expanded", String(isOpen));
    $("#mobile-menu").setAttribute("aria-label", isOpen ? "Fechar navegação" : "Abrir navegação");
  });
  $$("#main-nav a").forEach((link) => link.addEventListener("click", () => {
    $("#main-nav").classList.remove("open");
    $("#mobile-menu").setAttribute("aria-expanded", "false");
    $("#mobile-menu").setAttribute("aria-label", "Abrir navegação");
  }));

  $("#current-year").textContent = new Date().getFullYear();
  initializeDateAndTimes();
  renderAll();
})();
