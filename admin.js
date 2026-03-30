/* =========================================
   INÍCIO: Seletores principais
========================================= */
const authScreen = document.getElementById("authScreen");
const dashboard = document.getElementById("dashboard");
const authMessage = document.getElementById("authMessage");
const loggedUser = document.getElementById("loggedUser");
const globalMessage = document.getElementById("globalMessage");

const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

const menuForm = document.getElementById("menuForm");
const menuFormTitle = document.getElementById("menuFormTitle");
const menuCancelBtn = document.getElementById("menuCancelBtn");
const menuList = document.getElementById("menuList");

const eventForm = document.getElementById("eventForm");
const eventFormTitle = document.getElementById("eventFormTitle");
const eventCancelBtn = document.getElementById("eventCancelBtn");
const eventsList = document.getElementById("eventsList");

const galleryForm = document.getElementById("galleryForm");
const galleryFormTitle = document.getElementById("galleryFormTitle");
const galleryCancelBtn = document.getElementById("galleryCancelBtn");
const galleryList = document.getElementById("galleryList");
/* =========================================
   FIM: Seletores principais
========================================= */


/* =========================================
   INÍCIO: Configuração storage
========================================= */
const STORAGE_BUCKET = "bar-images";
/* =========================================
   FIM: Configuração storage
========================================= */


/* =========================================
   INÍCIO: Utilitários
========================================= */
function showToast(message) {
  if (!globalMessage) return;

  globalMessage.textContent = message;
  globalMessage.classList.add("show");

  setTimeout(() => {
    globalMessage.classList.remove("show");
  }, 2600);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  const numberValue = Number(value) || 0;
  return `${numberValue.toFixed(0)} MT`;
}

function setAuthMessage(message) {
  if (!authMessage) return;
  authMessage.textContent = message;
}

function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "jpg";
}

function filePathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;

  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) return null;

  return publicUrl.substring(index + marker.length);
}
/* =========================================
   FIM: Utilitários
========================================= */


/* =========================================
   INÍCIO: Upload de imagem
========================================= */
async function uploadImage(file, folderName) {
  if (!file) return null;

  const ext = getFileExtension(file.name);
  const fileName = `${folderName}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
}
/* =========================================
   FIM: Upload de imagem
========================================= */


/* =========================================
   INÍCIO: Apagar imagem do storage
========================================= */
async function deleteImageByPublicUrl(publicUrl) {
  const filePath = filePathFromPublicUrl(publicUrl);
  if (!filePath) return;

  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("Erro ao apagar imagem do storage:", error);
  }
}
/* =========================================
   FIM: Apagar imagem do storage
========================================= */


/* =========================================
   INÍCIO: Verificar sessão
========================================= */
async function checkSession() {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  if (session?.user) {
    showDashboard(session.user);
    await loadAllData();
  } else {
    showLogin();
  }
}
/* =========================================
   FIM: Verificar sessão
========================================= */


/* =========================================
   INÍCIO: Mostrar login/dashboard
========================================= */
function showLogin() {
  authScreen.classList.remove("hidden");
  dashboard.classList.add("hidden");
}

function showDashboard(user) {
  authScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");

  if (loggedUser) {
    loggedUser.textContent = user.email || "Admin";
  }
}
/* =========================================
   FIM: Mostrar login/dashboard
========================================= */


/* =========================================
   INÍCIO: Login / Logout
========================================= */
async function handleLogin(event) {
  event.preventDefault();
  setAuthMessage("Entrando...");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    setAuthMessage("Erro ao entrar. Verifica email e senha.");
    return;
  }

  setAuthMessage("");
  showDashboard(data.user);
  await loadAllData();
  showToast("Login feito com sucesso.");
}

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    showToast("Erro ao sair.");
    return;
  }

  showLogin();
  showToast("Sessão terminada.");
}
/* =========================================
   FIM: Login / Logout
========================================= */


/* =========================================
   INÍCIO: Tabs
========================================= */
function switchTab(tabId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function bindTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });
}
/* =========================================
   FIM: Tabs
========================================= */


/* =========================================
   INÍCIO: Reset forms
========================================= */
function resetMenuForm() {
  menuForm.reset();
  document.getElementById("menuId").value = "";
  document.getElementById("menuImageUrl").value = "";
  document.getElementById("menuAvailable").checked = true;
  document.getElementById("menuSortOrder").value = 0;
  menuFormTitle.textContent = "Novo item do menu";
}

function resetEventForm() {
  eventForm.reset();
  document.getElementById("eventId").value = "";
  document.getElementById("eventImageUrl").value = "";
  document.getElementById("eventActive").checked = true;
  document.getElementById("eventSortOrder").value = 0;
  eventFormTitle.textContent = "Novo evento";
}

function resetGalleryForm() {
  galleryForm.reset();
  document.getElementById("galleryId").value = "";
  document.getElementById("galleryImageUrl").value = "";
  document.getElementById("gallerySortOrder").value = 0;
  galleryFormTitle.textContent = "Nova imagem";
}
/* =========================================
   FIM: Reset forms
========================================= */


/* =========================================
   INÍCIO: Carregar menu
========================================= */
async function loadMenuItemsAdmin() {
  const { data, error } = await supabaseClient
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    menuList.innerHTML = `<p>Erro ao carregar menu.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    menuList.innerHTML = `<p>Nenhum item cadastrado.</p>`;
    return;
  }

  menuList.innerHTML = data.map((item) => `
    <div class="admin-item">
      <div class="admin-item-top">
        <div>
          <h5>${escapeHtml(item.name)}</h5>
          <p>${escapeHtml(item.description || "")}</p>
          <div class="admin-item-meta">
            ${formatPrice(item.price)} • ${item.available ? "Disponível" : "Indisponível"} • Ordem ${item.sort_order}
          </div>
        </div>
      </div>

      <div class="admin-item-actions">
        <button class="btn btn-outline menu-edit-btn" data-id="${item.id}">Editar</button>
        <button class="btn btn-outline menu-delete-btn" data-id="${item.id}">Apagar</button>
      </div>
    </div>
  `).join("");

  bindMenuActionButtons(data);
}
/* =========================================
   FIM: Carregar menu
========================================= */


/* =========================================
   INÍCIO: Carregar eventos
========================================= */
async function loadEventsAdmin() {
  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    eventsList.innerHTML = `<p>Erro ao carregar eventos.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    eventsList.innerHTML = `<p>Nenhum evento cadastrado.</p>`;
    return;
  }

  eventsList.innerHTML = data.map((item) => `
    <div class="admin-item">
      <div class="admin-item-top">
        <div>
          <h5>${escapeHtml(item.title)}</h5>
          <p>${escapeHtml(item.description || "")}</p>
          <div class="admin-item-meta">
            ${escapeHtml(item.event_date_label || "")} • ${item.active ? "Ativo" : "Inativo"} • Ordem ${item.sort_order}
          </div>
        </div>
      </div>

      <div class="admin-item-actions">
        <button class="btn btn-outline event-edit-btn" data-id="${item.id}">Editar</button>
        <button class="btn btn-outline event-delete-btn" data-id="${item.id}">Apagar</button>
      </div>
    </div>
  `).join("");

  bindEventActionButtons(data);
}
/* =========================================
   FIM: Carregar eventos
========================================= */


/* =========================================
   INÍCIO: Carregar galeria
========================================= */
async function loadGalleryAdmin() {
  const { data, error } = await supabaseClient
    .from("gallery")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    galleryList.innerHTML = `<p>Erro ao carregar galeria.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    galleryList.innerHTML = `<p>Nenhuma imagem cadastrada.</p>`;
    return;
  }

  galleryList.innerHTML = data.map((item) => `
    <div class="admin-item">
      <div class="admin-item-top">
        <div>
          <h5>${escapeHtml(item.title || "Sem título")}</h5>
          <p>${escapeHtml(item.image_url)}</p>
          <div class="admin-item-meta">
            Ordem ${item.sort_order}
          </div>
        </div>
      </div>

      <div class="admin-item-actions">
        <button class="btn btn-outline gallery-edit-btn" data-id="${item.id}">Editar</button>
        <button class="btn btn-outline gallery-delete-btn" data-id="${item.id}">Apagar</button>
      </div>
    </div>
  `).join("");

  bindGalleryActionButtons(data);
}
/* =========================================
   FIM: Carregar galeria
========================================= */


/* =========================================
   INÍCIO: Carregar tudo
========================================= */
async function loadAllData() {
  await Promise.all([
    loadMenuItemsAdmin(),
    loadEventsAdmin(),
    loadGalleryAdmin()
  ]);
}
/* =========================================
   FIM: Carregar tudo
========================================= */


/* =========================================
   INÍCIO: Bind ações menu
========================================= */
function bindMenuActionButtons(items) {
  document.querySelectorAll(".menu-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items.find((row) => String(row.id) === String(button.dataset.id));
      if (!item) return;

      document.getElementById("menuId").value = item.id;
      document.getElementById("menuName").value = item.name || "";
      document.getElementById("menuDescription").value = item.description || "";
      document.getElementById("menuPrice").value = item.price || 0;
      document.getElementById("menuImageUrl").value = item.image_url || "";
      document.getElementById("menuBadge").value = item.badge || "";
      document.getElementById("menuSortOrder").value = item.sort_order || 0;
      document.getElementById("menuAvailable").checked = !!item.available;
      menuFormTitle.textContent = "Editar item do menu";
      switchTab("menuTab");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll(".menu-delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = items.find((row) => String(row.id) === String(button.dataset.id));
      const confirmed = confirm("Tens certeza que queres apagar este item do menu?");
      if (!confirmed) return;

      const { error } = await supabaseClient
        .from("menu_items")
        .delete()
        .eq("id", button.dataset.id);

      if (error) {
        console.error(error);
        showToast("Erro ao apagar item do menu.");
        return;
      }

      if (item?.image_url) {
        await deleteImageByPublicUrl(item.image_url);
      }

      showToast("Item do menu apagado.");
      await loadMenuItemsAdmin();
      resetMenuForm();
    });
  });
}
/* =========================================
   FIM: Bind ações menu
========================================= */


/* =========================================
   INÍCIO: Bind ações eventos
========================================= */
function bindEventActionButtons(items) {
  document.querySelectorAll(".event-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items.find((row) => String(row.id) === String(button.dataset.id));
      if (!item) return;

      document.getElementById("eventId").value = item.id;
      document.getElementById("eventTitle").value = item.title || "";
      document.getElementById("eventDescription").value = item.description || "";
      document.getElementById("eventDateLabel").value = item.event_date_label || "";
      document.getElementById("eventImageUrl").value = item.image_url || "";
      document.getElementById("eventWhatsappText").value = item.whatsapp_text || "";
      document.getElementById("eventSortOrder").value = item.sort_order || 0;
      document.getElementById("eventActive").checked = !!item.active;
      eventFormTitle.textContent = "Editar evento";
      switchTab("eventsTab");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll(".event-delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = items.find((row) => String(row.id) === String(button.dataset.id));
      const confirmed = confirm("Tens certeza que queres apagar este evento?");
      if (!confirmed) return;

      const { error } = await supabaseClient
        .from("events")
        .delete()
        .eq("id", button.dataset.id);

      if (error) {
        console.error(error);
        showToast("Erro ao apagar evento.");
        return;
      }

      if (item?.image_url) {
        await deleteImageByPublicUrl(item.image_url);
      }

      showToast("Evento apagado.");
      await loadEventsAdmin();
      resetEventForm();
    });
  });
}
/* =========================================
   FIM: Bind ações eventos
========================================= */


/* =========================================
   INÍCIO: Bind ações galeria
========================================= */
function bindGalleryActionButtons(items) {
  document.querySelectorAll(".gallery-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items.find((row) => String(row.id) === String(button.dataset.id));
      if (!item) return;

      document.getElementById("galleryId").value = item.id;
      document.getElementById("galleryTitle").value = item.title || "";
      document.getElementById("galleryImageUrl").value = item.image_url || "";
      document.getElementById("gallerySortOrder").value = item.sort_order || 0;
      galleryFormTitle.textContent = "Editar imagem";
      switchTab("galleryTab");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll(".gallery-delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = items.find((row) => String(row.id) === String(button.dataset.id));
      const confirmed = confirm("Tens certeza que queres apagar esta imagem?");
      if (!confirmed) return;

      const { error } = await supabaseClient
        .from("gallery")
        .delete()
        .eq("id", button.dataset.id);

      if (error) {
        console.error(error);
        showToast("Erro ao apagar imagem.");
        return;
      }

      if (item?.image_url) {
        await deleteImageByPublicUrl(item.image_url);
      }

      showToast("Imagem apagada.");
      await loadGalleryAdmin();
      resetGalleryForm();
    });
  });
}
/* =========================================
   FIM: Bind ações galeria
========================================= */


/* =========================================
   INÍCIO: Salvar menu
========================================= */
async function handleMenuSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("menuId").value;
  const currentImageUrl = document.getElementById("menuImageUrl").value.trim();
  const imageFile = document.getElementById("menuImageFile").files[0];

  let finalImageUrl = currentImageUrl;

  try {
    if (imageFile) {
      finalImageUrl = await uploadImage(imageFile, "menu");

      if (id && currentImageUrl && currentImageUrl !== finalImageUrl) {
        await deleteImageByPublicUrl(currentImageUrl);
      }
    }

    const payload = {
      name: document.getElementById("menuName").value.trim(),
      description: document.getElementById("menuDescription").value.trim(),
      price: Number(document.getElementById("menuPrice").value || 0),
      image_url: finalImageUrl,
      badge: document.getElementById("menuBadge").value.trim(),
      sort_order: Number(document.getElementById("menuSortOrder").value || 0),
      available: document.getElementById("menuAvailable").checked,
    };

    let error = null;

    if (id) {
      ({ error } = await supabaseClient
        .from("menu_items")
        .update(payload)
        .eq("id", id));
    } else {
      ({ error } = await supabaseClient
        .from("menu_items")
        .insert(payload));
    }

    if (error) throw error;

    showToast(id ? "Item do menu atualizado." : "Item do menu criado.");
    resetMenuForm();
    await loadMenuItemsAdmin();
  } catch (error) {
    console.error(error);
    showToast("Erro ao salvar item do menu.");
  }
}
/* =========================================
   FIM: Salvar menu
========================================= */


/* =========================================
   INÍCIO: Salvar evento
========================================= */
async function handleEventSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("eventId").value;
  const currentImageUrl = document.getElementById("eventImageUrl").value.trim();
  const imageFile = document.getElementById("eventImageFile").files[0];

  let finalImageUrl = currentImageUrl;

  try {
    if (imageFile) {
      finalImageUrl = await uploadImage(imageFile, "events");

      if (id && currentImageUrl && currentImageUrl !== finalImageUrl) {
        await deleteImageByPublicUrl(currentImageUrl);
      }
    }

    const payload = {
      title: document.getElementById("eventTitle").value.trim(),
      description: document.getElementById("eventDescription").value.trim(),
      event_date_label: document.getElementById("eventDateLabel").value.trim(),
      image_url: finalImageUrl,
      whatsapp_text: document.getElementById("eventWhatsappText").value.trim(),
      sort_order: Number(document.getElementById("eventSortOrder").value || 0),
      active: document.getElementById("eventActive").checked,
    };

    let error = null;

    if (id) {
      ({ error } = await supabaseClient
        .from("events")
        .update(payload)
        .eq("id", id));
    } else {
      ({ error } = await supabaseClient
        .from("events")
        .insert(payload));
    }

    if (error) throw error;

    showToast(id ? "Evento atualizado." : "Evento criado.");
    resetEventForm();
    await loadEventsAdmin();
  } catch (error) {
    console.error(error);
    showToast("Erro ao salvar evento.");
  }
}
/* =========================================
   FIM: Salvar evento
========================================= */


/* =========================================
   INÍCIO: Salvar galeria
========================================= */
async function handleGallerySubmit(event) {
  event.preventDefault();

  const id = document.getElementById("galleryId").value;
  const currentImageUrl = document.getElementById("galleryImageUrl").value.trim();
  const imageFile = document.getElementById("galleryImageFile").files[0];

  let finalImageUrl = currentImageUrl;

  try {
    if (imageFile) {
      finalImageUrl = await uploadImage(imageFile, "gallery");

      if (id && currentImageUrl && currentImageUrl !== finalImageUrl) {
        await deleteImageByPublicUrl(currentImageUrl);
      }
    }

    const payload = {
      title: document.getElementById("galleryTitle").value.trim(),
      image_url: finalImageUrl,
      sort_order: Number(document.getElementById("gallerySortOrder").value || 0),
    };

    let error = null;

    if (id) {
      ({ error } = await supabaseClient
        .from("gallery")
        .update(payload)
        .eq("id", id));
    } else {
      ({ error } = await supabaseClient
        .from("gallery")
        .insert(payload));
    }

    if (error) throw error;

    showToast(id ? "Imagem atualizada." : "Imagem criada.");
    resetGalleryForm();
    await loadGalleryAdmin();
  } catch (error) {
    console.error(error);
    showToast("Erro ao salvar imagem.");
  }
}
/* =========================================
   FIM: Salvar galeria
========================================= */


/* =========================================
   INÍCIO: Bind formulários
========================================= */
function bindForms() {
  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);

  menuForm.addEventListener("submit", handleMenuSubmit);
  eventForm.addEventListener("submit", handleEventSubmit);
  galleryForm.addEventListener("submit", handleGallerySubmit);

  menuCancelBtn.addEventListener("click", resetMenuForm);
  eventCancelBtn.addEventListener("click", resetEventForm);
  galleryCancelBtn.addEventListener("click", resetGalleryForm);
}
/* =========================================
   FIM: Bind formulários
========================================= */


/* =========================================
   INÍCIO: Listener auth
========================================= */
function bindAuthListener() {
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      showDashboard(session.user);
    } else {
      showLogin();
    }
  });
}
/* =========================================
   FIM: Listener auth
========================================= */


/* =========================================
   INÍCIO: Inicialização
========================================= */
async function initAdmin() {
  bindForms();
  bindTabs();
  bindAuthListener();
  resetMenuForm();
  resetEventForm();
  resetGalleryForm();
  await checkSession();
}

document.addEventListener("DOMContentLoaded", initAdmin);
/* =========================================
   FIM: Inicialização
========================================= */