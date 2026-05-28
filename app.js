const STORAGE_KEY = "deliverygo-menu-saas";

const starterData = {
  restaurant: {
    name: "Bistro Avenida",
    description: "Burgers, pratos executivos e bebidas geladas sem fila no balcao.",
    brandColor: "#0f8b6f",
    whatsapp: "5511999999999",
  },
  analytics: {
    visitsToday: 38,
    visitsMonth: 842,
  },
  tables: ["01", "02", "03", "04", "05", "06"],
  items: [
    {
      id: crypto.randomUUID(),
      name: "Burger da Casa",
      category: "Lanches",
      price: 32.9,
      description: "Blend 160g, queijo, cebola caramelizada e molho especial.",
      available: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Executivo de Frango",
      category: "Pratos",
      price: 29.9,
      description: "Arroz, feijao, salada, fritas e frango grelhado.",
      available: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Limonada da Casa",
      category: "Bebidas",
      price: 11.9,
      description: "Limao siciliano, hortela e gelo.",
      available: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Brownie com Sorvete",
      category: "Sobremesas",
      price: 19.9,
      description: "Brownie quente, sorvete de creme e calda.",
      available: false,
    },
  ],
};

let state = loadState();
let selectedPublicCategory = "all";
let cart = {};
let trackedPublicVisit = false;

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterData));
    return structuredClone(starterData);
  }

  try {
    return normalizeState(JSON.parse(stored));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterData));
    return structuredClone(starterData);
  }
}

function normalizeState(savedState) {
  return {
    ...structuredClone(starterData),
    ...savedState,
    restaurant: {
      ...starterData.restaurant,
      ...(savedState.restaurant || {}),
    },
    analytics: {
      ...starterData.analytics,
      ...(savedState.analytics || {}),
    },
    tables: savedState.tables?.length ? savedState.tables : starterData.tables,
    items: savedState.items?.length ? savedState.items : starterData.items,
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("deliverygo:update"));
}

function getTableFromUrl() {
  return new URLSearchParams(window.location.search).get("mesa") || state.tables[0] || "01";
}

function publicUrl(table) {
  const url = new URL(window.location.href);
  url.searchParams.set("mesa", table);
  url.hash = "public";
  return url.href;
}

function setView(viewId) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  $$(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });

  if (viewId === "public") {
    const url = new URL(window.location.href);
    url.hash = "public";
    history.replaceState(null, "", url.href);
    trackPublicVisit();
  }
}

function trackPublicVisit() {
  if (trackedPublicVisit) return;
  trackedPublicVisit = true;
  state.analytics.visitsToday += 1;
  state.analytics.visitsMonth += 1;
  persist();
}

function hydrateRestaurantForm() {
  $("#restaurantName").value = state.restaurant.name;
  $("#restaurantDescription").value = state.restaurant.description;
  $("#brandColor").value = state.restaurant.brandColor;
  document.documentElement.style.setProperty("--brand", state.restaurant.brandColor);
  $("#dashboardHeading").textContent = state.restaurant.name;
  $("#restaurantEyebrow").textContent = "Painel do restaurante";
}

function renderMetrics() {
  const availableItems = state.items.filter((item) => item.available);
  const pausedItems = state.items.length - availableItems.length;
  $("#metricTables").textContent = state.tables.length;
  $("#metricItems").textContent = availableItems.length;
  $("#metricVisits").textContent = state.analytics.visitsToday;
  $("#metricPaused").textContent = pausedItems;
  $("#availableStatus").textContent = `${availableItems.length} itens disponiveis`;
  $("#pausedStatus").textContent = `${pausedItems} itens pausados`;
  $("#tableStatus").textContent = `${state.tables.length} mesas publicadas`;
  $("#monthVisitsStatus").textContent = `${state.analytics.visitsMonth} visitas no mes`;
  $("#systemStatus").textContent = pausedItems ? "Revisar itens" : "Tudo certo";
}

function categories(includeAll = false) {
  const values = [...new Set(state.items.map((item) => item.category))];
  return includeAll ? ["all", ...values] : values;
}

function renderCategoryFilter() {
  const filter = $("#categoryFilter");
  const current = filter.value || "all";
  filter.innerHTML = "";
  categories(true).forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category === "all" ? "Todas" : category;
    filter.append(option);
  });
  filter.value = categories(true).includes(current) ? current : "all";
}

function renderAdminItems() {
  const list = $("#adminItems");
  const template = $("#adminItemTemplate");
  const filter = $("#categoryFilter").value || "all";
  const items = state.items.filter((item) => filter === "all" || item.category === filter);
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = '<p class="empty-state">Nenhum item nessa categoria.</p>';
    return;
  }

  items.forEach((item) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = item.id;
    node.classList.toggle("unavailable", !item.available);
    node.querySelector("strong").textContent = item.name;
    node.querySelector("span").textContent = `${item.category} - ${money.format(item.price)}`;
    node.querySelector("p").textContent = item.description || "Sem descricao.";
    list.append(node);
  });
}

function renderTables() {
  const grid = $("#tableGrid");
  grid.innerHTML = "";

  state.tables.forEach((table) => {
    const url = publicUrl(table);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
    const card = document.createElement("article");
    card.className = "table-card";
    card.innerHTML = `
      <h3>Mesa ${table}</h3>
      <img src="${qrUrl}" alt="QR Code da mesa ${table}" />
      <code>${url}</code>
      <button type="button" data-table="${table}">Abrir menu</button>
    `;
    grid.append(card);
  });
}

function renderDashboardQr() {
  const mainTable = state.tables[0] || "01";
  const url = publicUrl(mainTable);
  $("#qrTableLabel").textContent = `Mesa ${mainTable}`;
  $("#dashboardQr").src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`;
}

function renderPublicMenu() {
  const available = state.items.filter((item) => item.available);
  const publicCategories = ["all", ...new Set(available.map((item) => item.category))];
  if (!publicCategories.includes(selectedPublicCategory)) selectedPublicCategory = "all";

  $("#publicName").textContent = state.restaurant.name;
  $("#publicDescription").textContent = state.restaurant.description;
  $("#publicTable").textContent = `Mesa ${getTableFromUrl()}`;
  $("#publicHero").style.backgroundColor = state.restaurant.brandColor;

  const chips = $("#publicCategories");
  chips.innerHTML = "";
  publicCategories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === selectedPublicCategory ? "active" : "";
    button.textContent = category === "all" ? "Todos" : category;
    button.addEventListener("click", () => {
      selectedPublicCategory = category;
      renderPublicMenu();
    });
    chips.append(button);
  });

  const list = $("#publicItems");
  const items = available.filter((item) => selectedPublicCategory === "all" || item.category === selectedPublicCategory);
  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = '<p class="empty-state">Cardapio em atualizacao.</p>';
  }

  items.forEach((item) => {
    const quantity = cart[item.id] || 0;
    const node = document.createElement("article");
    node.className = "public-item";
    node.innerHTML = `
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${money.format(item.price)}</span>
        <p>${escapeHtml(item.description || "")}</p>
      </div>
      <div class="quantity">
        <button type="button" data-add="${item.id}">+</button>
        <strong>${quantity}</strong>
        <button type="button" data-remove="${item.id}">-</button>
      </div>
    `;
    list.append(node);
  });

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = state.items.find((candidate) => candidate.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
  $("#orderSummary").textContent = `${totalItems} itens - ${money.format(totalPrice)}`;
}

function resetItemForm() {
  $("#itemId").value = "";
  $("#itemName").value = "";
  $("#itemCategory").value = "Lanches";
  $("#itemPrice").value = "";
  $("#itemDescription").value = "";
  $("#itemAvailable").checked = true;
}

function renderAll() {
  hydrateRestaurantForm();
  renderMetrics();
  renderCategoryFilter();
  renderAdminItems();
  renderTables();
  renderDashboardQr();
  renderPublicMenu();
}

function bindEvents() {
  $$(".nav-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  $$("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.viewTarget));
  });

  $("#restaurantForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.restaurant.name = $("#restaurantName").value.trim() || "Restaurante";
    state.restaurant.description = $("#restaurantDescription").value.trim() || "Cardapio digital";
    state.restaurant.brandColor = $("#brandColor").value;
    persist();
  });

  $("#itemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#itemId").value || crypto.randomUUID();
    const item = {
      id,
      name: $("#itemName").value.trim(),
      category: $("#itemCategory").value,
      price: Number($("#itemPrice").value),
      description: $("#itemDescription").value.trim(),
      available: $("#itemAvailable").checked,
    };
    const existingIndex = state.items.findIndex((candidate) => candidate.id === id);
    if (existingIndex >= 0) state.items[existingIndex] = item;
    else state.items.unshift(item);
    resetItemForm();
    persist();
  });

  $("#clearItem").addEventListener("click", resetItemForm);
  $("#categoryFilter").addEventListener("change", renderAdminItems);

  $("#adminItems").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    const itemNode = event.target.closest(".admin-item");
    if (!button || !itemNode) return;
    const item = state.items.find((candidate) => candidate.id === itemNode.dataset.id);
    if (!item) return;

    if (button.dataset.action === "edit") {
      $("#itemId").value = item.id;
      $("#itemName").value = item.name;
      $("#itemCategory").value = item.category;
      $("#itemPrice").value = item.price;
      $("#itemDescription").value = item.description;
      $("#itemAvailable").checked = item.available;
    }

    if (button.dataset.action === "toggle") {
      item.available = !item.available;
      persist();
    }

    if (button.dataset.action === "delete") {
      state.items = state.items.filter((candidate) => candidate.id !== item.id);
      delete cart[item.id];
      persist();
    }
  });

  $("#addTable").addEventListener("click", () => {
    const nextNumber = String(state.tables.length + 1).padStart(2, "0");
    state.tables.push(nextNumber);
    persist();
  });

  $("#tableGrid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-table]");
    if (!button) return;
    const url = new URL(window.location.href);
    url.searchParams.set("mesa", button.dataset.table);
    url.hash = "public";
    history.replaceState(null, "", url.href);
    setView("public");
    renderPublicMenu();
  });

  $("#openMainQr").addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("mesa", state.tables[0] || "01");
    url.hash = "public";
    history.replaceState(null, "", url.href);
    setView("public");
    renderPublicMenu();
  });

  $("#publicItems").addEventListener("click", (event) => {
    const addId = event.target.dataset.add;
    const removeId = event.target.dataset.remove;
    if (addId) cart[addId] = (cart[addId] || 0) + 1;
    if (removeId) cart[removeId] = Math.max((cart[removeId] || 0) - 1, 0);
    renderPublicMenu();
  });

  $("#whatsappButton").addEventListener("click", () => {
    const lines = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = state.items.find((candidate) => candidate.id === id);
        return item ? `${qty}x ${item.name}` : "";
      })
      .filter(Boolean);
    const message = `Mesa ${getTableFromUrl()} - Pedido:%0A${lines.join("%0A") || "Quero fazer um pedido."}`;
    window.open(`https://wa.me/${state.restaurant.whatsapp}?text=${message}`, "_blank", "noopener");
  });

  window.addEventListener("deliverygo:update", renderAll);
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = loadState();
    renderAll();
  });
}

bindEvents();
renderAll();

if (location.hash === "#public") {
  setView("public");
}
