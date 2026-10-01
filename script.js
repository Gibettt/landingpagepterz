"use strict";

/* =========================================================
   REFERENCES

   Tidak menggunakan backend, database, atau pengiriman form.
   Brief hanya disusun di browser pengguna.
========================================================= */

const header = document.getElementById("site-header");
const menuToggle = document.getElementById("menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
const headerBrand = document.querySelector(".site-header .brand");

const filterContainer = document.getElementById("product-filters");
const filterButtons = [
  ...document.querySelectorAll("[data-filter]")
];
const productCards = [
  ...document.querySelectorAll("#product-grid .product-card")
];
const resultCount = document.getElementById("result-count");

const briefForm = document.getElementById("brief-form");
const partnershipSelect = document.getElementById("partnership-select");
const categorySelect = document.getElementById("category-select");
const productInput = document.getElementById("product-interest");
const notesInput = document.getElementById("business-notes");

const contactStatus = document.getElementById("contact-status");

const desktopBreakpoint = window.matchMedia("(min-width: 901px)");
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function isMobileMenuOpen() {
  return menuToggle.getAttribute("aria-expanded") === "true";
}

function setMobileMenu(isOpen, restoreFocus = false) {
  const shouldOpen = isOpen && !desktopBreakpoint.matches;

  menuToggle.setAttribute("aria-expanded", String(shouldOpen));

  menuToggle.setAttribute(
    "aria-label",
    shouldOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
  );

  mobileNav.hidden = !shouldOpen;

  if (restoreFocus && !desktopBreakpoint.matches) {
    menuToggle.focus({ preventScroll: true });
  }
}

function focusSectionFromLink(link) {
  const href = link.getAttribute("href");

  if (!href || !href.startsWith("#")) return;

  const section = document.getElementById(href.slice(1));

  if (!section) return;

  // Elemen dapat menerima fokus secara programatis,
  // tetapi tidak ditambahkan ke urutan Tab.
  section.setAttribute("tabindex", "-1");
  section.focus({ preventScroll: true });
}

menuToggle.addEventListener("click", () => {
  setMobileMenu(!isMobileMenuOpen());
});

mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setMobileMenu(false);
    focusSectionFromLink(link);
  });
});

document.addEventListener("click", (event) => {
  if (!isMobileMenuOpen()) return;
  if (header.contains(event.target)) return;

  const focusIsInMenu = mobileNav.contains(document.activeElement);

  setMobileMenu(false, focusIsInMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !isMobileMenuOpen()) return;

  event.preventDefault();
  setMobileMenu(false, true);
});

// Menu ini bukan modal, sehingga fokus tidak dikunci.
// Tutup ketika navigasi keyboard sudah keluar dari header.
header.addEventListener("focusout", (event) => {
  if (!isMobileMenuOpen()) return;
  if (!event.relatedTarget) return;

  if (!header.contains(event.relatedTarget)) {
    setMobileMenu(false);
  }
});

desktopBreakpoint.addEventListener("change", () => {
  const focusWasInMenu = mobileNav.contains(document.activeElement);

  setMobileMenu(false);

  if (focusWasInMenu) {
    const focusTarget = desktopBreakpoint.matches
      ? headerBrand
      : menuToggle;

    focusTarget.focus({ preventScroll: true });
  }
});

/* =========================================================
   PRODUCT CATEGORY FILTERS + PAGINATION

   Kartu produk tetap berada di HTML agar dapat dibaca
   ketika JavaScript tidak aktif.
   Pagination: 8 kartu per halaman, tombol ← →.
========================================================= */

const PAGE_SIZE = 8;

const paginationNav  = document.getElementById("product-pagination");
const pagePrevBtn    = document.getElementById("page-prev");
const pageNextBtn    = document.getElementById("page-next");
const paginationInfo = document.getElementById("pagination-info");

let currentPage     = 1;
let activeCategory  = "all";

function getMatchingCards() {
  return productCards.filter((card) =>
    activeCategory === "all" || card.dataset.category === activeCategory
  );
}

function renderPage() {
  const matching   = getMatchingCards();
  const totalPages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));

  // Clamp currentPage
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex   = startIndex + PAGE_SIZE;

  // Show/hide every card
  productCards.forEach((card) => {
    card.hidden = true;
  });

  matching.forEach((card, index) => {
    card.hidden = index < startIndex || index >= endIndex;
  });

  // Update count text
  const shown = Math.min(PAGE_SIZE, matching.length - startIndex);
  resultCount.textContent =
    activeCategory === "all"
      ? `${matching.length} jenis produk · halaman ${currentPage} dari ${totalPages}`
      : `${matching.length} produk kategori ${activeCategory} · halaman ${currentPage} dari ${totalPages}`;

  // Pagination controls
  paginationInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  pagePrevBtn.disabled = currentPage <= 1;
  pageNextBtn.disabled = currentPage >= totalPages;

  // Hide pagination entirely if only 1 page
  paginationNav.hidden = totalPages <= 1;
}

function setCategory(category) {
  activeCategory = category;
  currentPage    = 1;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === category;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderPage();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCategory(button.dataset.filter);
  });
});

pagePrevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderPage();
    document.getElementById("produk").scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  }
});

pageNextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(getMatchingCards().length / PAGE_SIZE);
  if (currentPage < totalPages) {
    currentPage += 1;
    renderPage();
    document.getElementById("produk").scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  }
});

/* =========================================================
   CONSULTATION FORM HELPERS
========================================================= */

function invalidateBrief() {
  briefResult.hidden = true;
  briefOutput.value = "";
  contactStatus.textContent = "";
}

function setSelectValue(select, value) {
  if (!value) return;

  const optionExists = [...select.options].some(
    (option) => option.value === value
  );

  if (optionExists) {
    select.value = value;
  }
}

// Bila input diubah, hasil lama disembunyikan
// agar tidak tersalin sebagai brief yang sudah kedaluwarsa.
[
  partnershipSelect,
  categorySelect,
  productInput,
  notesInput
].forEach((field) => {
  field.addEventListener("input", invalidateBrief);
  field.addEventListener("change", invalidateBrief);
});

/* =========================================================
   PREFILL FROM CTA LINKS

   Atribut yang dipakai:
   - data-path
   - data-category
   - data-product
========================================================= */

document.querySelectorAll("a[data-path]").forEach((link) => {
  link.addEventListener("click", () => {
    setSelectValue(partnershipSelect, link.dataset.path);
    setSelectValue(categorySelect, link.dataset.category);

    if (link.dataset.product) {
      productInput.value = link.dataset.product;
    }

    // Catatan yang sudah ditulis pengguna tidak dihapus.
    invalidateBrief();

    contactStatus.textContent =
      `Pilihan ${partnershipSelect.value} sudah diisikan. ` +
      "Lengkapi kebutuhan Anda untuk membuat brief.";
  });
});

/* =========================================================
   BRIEF GENERATOR

   Output menggunakan .value, bukan innerHTML.
   Tidak ada request jaringan atau pengiriman pesan otomatis.
========================================================= */

function getClosingMessage(partnership) {
  switch (partnership) {
    case "Makloon / Private Label":
      return (
        "Saya ingin berkonsultasi tentang pengembangan produk " +
        "dengan merek sendiri. Mohon informasi mengenai formulasi, " +
        "pilihan kemasan, minimum pemesanan, biaya, dan estimasi " +
        "waktu pengerjaan."
      );

    case "Distributor & Reseller":
    case "Reseller":
    case "Distributor":
      return (
        "Saya tertarik bergabung dalam program kemitraan Distributor & Reseller produk ERZ. " +
        "Mohon informasi katalog produk lengkap, skema harga grosir mitra, " +
        "ketentuan pembelian, dan ketersediaan wilayah."
      );

    case "Beli Satuan / Eceran":
      return (
        "Saya tertarik untuk membeli satuan produk ERZ. " +
        "Mohon informasi ketersediaan stok, harga satuan, dan estimasi ongkos kirim ke alamat saya."
      );

    default:
      return (
        "Saya ingin berkonsultasi mengenai produk dan peluang kemitraan " +
        "yang sesuai dengan kebutuhan saya. " +
        "Mohon arahan mengenai langkah awal konsultasi."
      );
  }
}

function getGreeting(partnership) {
  switch (partnership) {
    case "Makloon / Private Label":
      return "Halo Naufal,";
    case "Distributor & Reseller":
    case "Reseller":
    case "Distributor":
      return "Halo Aldi,";
    case "Beli Satuan / Eceran":
      return "Halo Wanda,";
    default:
      return "Halo tim PT ERZ Grup Indonesia,";
  }
}

function buildBrief() {
  const partnership = partnershipSelect.value;
  const category = categorySelect.value;
  const product = productInput.value.trim();
  const notes = notesInput.value.trim();

  const lines = [
    getGreeting(partnership),
    "",
    "Saya ingin berkonsultasi mengenai peluang kerja sama.",
    "",
    `Jalur kemitraan: ${partnership}`,
    `Kategori produk: ${category}`
  ];

  if (product) {
    lines.push(`Jenis produk: ${product}`);
  }

  if (notes) {
    lines.push("", "Gambaran kebutuhan:", notes);
  }

  lines.push(
    "",
    getClosingMessage(partnership),
    "",
    "Terima kasih."
  );

  return lines.join("\n");
}

const WA_TARGETS = {
  makloon: {
    phone: "6282319907974",
    name: "Naufal (Makloon & Formulasi)",
    tag: "WA_Naufal_Makloon"
  },
  kemitraan: {
    phone: "6282319907971",
    name: "Aldi (Distributor & Reseller)",
    tag: "WA_Aldi_Distributor"
  },
  pemesanan: {
    phone: "6282319907972",
    name: "Wanda (Beli Satuan & Sampel)",
    tag: "WA_Wanda_BeliSatuan"
  }
};

function getTargetAdmin(partnership) {
  switch (partnership) {
    case "Makloon / Private Label":
      return WA_TARGETS.makloon;
    case "Distributor & Reseller":
    case "Reseller":
    case "Distributor":
      return WA_TARGETS.kemitraan;
    case "Beli Satuan / Eceran":
    default:
      return WA_TARGETS.pemesanan;
  }
}

briefForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!briefForm.reportValidity()) return;

  const briefText = buildBrief();
  const partnership = partnershipSelect.value;
  const admin = getTargetAdmin(partnership);

  const waUrl = `https://wa.me/${admin.phone}?text=${encodeURIComponent(briefText)}`;

  // Kirim event konversi ke Meta Pixel
  if (typeof fbq === "function") {
    fbq("track", "Lead", { content_name: `Brief - ${admin.name}` });
    fbq("track", "Contact", { content_name: `Brief - ${admin.name}` });
    fbq("trackCustom", `SubmitBrief_${admin.tag}`);
  }

  // Buka WhatsApp tujuan di tab baru secara langsung dan otomatis
  window.open(waUrl, "_blank");
});

/* =========================================================
   HEADER SCROLL & ACTIVE NAV (SCROLLSPY)
========================================================= */

const navLinks = document.querySelectorAll(
  ".desktop-nav a[href^='#'], .mobile-nav a[href^='#']"
);
const trackedSectionIds = ["tentang", "layanan", "produk", "kemitraan", "faq"];
const trackedSections = trackedSectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function updateScrollUI() {
  const scrollPosition = window.scrollY;

  header.classList.toggle("is-scrolled", scrollPosition > 12);
}

function updateActiveNavLink() {
  const scrollY = window.scrollY;
  const headerHeight = header ? header.offsetHeight : 70;
  const scrollThreshold = scrollY + headerHeight + 80;

  let activeSectionId = "";

  for (let i = trackedSections.length - 1; i >= 0; i--) {
    const section = trackedSections[i];
    if (section.offsetTop <= scrollThreshold) {
      activeSectionId = section.id;
      break;
    }
  }

  navLinks.forEach((link) => {
    const targetId = link.getAttribute("href").replace("#", "");
    const isActive = targetId && targetId === activeSectionId;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("href").replace("#", "");
    navLinks.forEach((l) => {
      const match = l.getAttribute("href").replace("#", "") === targetId;
      l.classList.toggle("is-active", match);
    });
  });
});

let scrollFramePending = false;

window.addEventListener(
  "scroll",
  () => {
    if (scrollFramePending) return;

    scrollFramePending = true;

    window.requestAnimationFrame(() => {
      updateScrollUI();
      updateActiveNavLink();
      scrollFramePending = false;
    });
  },
  { passive: true }
);

/* =========================================================
   INITIALIZATION

   Kontrol interaktif baru ditampilkan setelah
   event handler selesai dipasang.
========================================================= */

document.getElementById("year").textContent =
  new Date().getFullYear();

setMobileMenu(false);
menuToggle.hidden = false;

setCategory("all");
filterContainer.hidden = false;
paginationNav.hidden = false;

briefForm.hidden = false;

updateScrollUI();
updateActiveNavLink();

/* =========================================================
   FLOATING WHATSAPP MULTI-CONTACT POPUP
========================================================= */

const waToggleBtn = document.getElementById("wa-toggle-btn");
const waPopup = document.getElementById("wa-popup");
const waCloseBtn = document.getElementById("wa-close-btn");
const waBubbleLabel = document.getElementById("wa-bubble-label");
const waContainer = document.getElementById("wa-container");

function openWaPopup() {
  if (!waPopup || !waToggleBtn) return;
  waPopup.hidden = false;
  requestAnimationFrame(() => {
    waPopup.classList.add("is-active");
    waPopup.setAttribute("aria-hidden", "false");
    waToggleBtn.setAttribute("aria-expanded", "true");
    waToggleBtn.classList.add("is-open");
    if (waBubbleLabel) waBubbleLabel.style.opacity = "0";
  });
}

function closeWaPopup() {
  if (!waPopup || !waToggleBtn) return;
  waPopup.classList.remove("is-active");
  waPopup.setAttribute("aria-hidden", "true");
  waToggleBtn.setAttribute("aria-expanded", "false");
  waToggleBtn.classList.remove("is-open");
  if (waBubbleLabel) waBubbleLabel.style.opacity = "1";
  setTimeout(() => {
    if (!waPopup.classList.contains("is-active")) {
      waPopup.hidden = true;
    }
  }, 240);
}

if (waToggleBtn) {
  waToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = waPopup && waPopup.classList.contains("is-active");
    if (isOpen) {
      closeWaPopup();
    } else {
      openWaPopup();
    }
  });
}

if (waCloseBtn) {
  waCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeWaPopup();
    if (waToggleBtn) waToggleBtn.focus({ preventScroll: true });
  });
}

// Tutup ketika klik di luar kartu popup
document.addEventListener("click", (e) => {
  if (!waPopup || waPopup.hidden) return;
  if (waContainer && !waContainer.contains(e.target)) {
    closeWaPopup();
  }
});

// Tutup dengan tombol Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && waPopup && !waPopup.hidden) {
    closeWaPopup();
    if (waToggleBtn) waToggleBtn.focus({ preventScroll: true });
  }
});

/* =========================================================
   META PIXEL TRACKING UNTUK WHATSAPP & CTA
========================================================= */

// Tombol CTA Konsultasi di Section Buka Pop-up WhatsApp
const ctaWaKonsultasiBtn = document.getElementById("cta-wa-konsultasi-btn");
if (ctaWaKonsultasiBtn) {
  ctaWaKonsultasiBtn.addEventListener("click", () => {
    openWaPopup();
    if (typeof fbq === "function") {
      fbq("trackCustom", "ClickCTA_Konsultasi");
    }
  });
}

// Pelacak Otomatis Semua Klik WhatsApp (Meta Pixel Event)
document.addEventListener("click", (e) => {
  const waLink = e.target.closest('a[href*="wa.me"]');
  if (waLink) {
    const metaTag = waLink.getAttribute("data-track-meta") || "WA_Direct_Click";
    
    // Kirim event ke Meta Pixel
    if (typeof fbq === "function") {
      // 1. Standard Event (Contact & Lead untuk iklan FB/IG Ads)
      fbq("track", "Contact", { content_name: metaTag });
      fbq("track", "Lead", { content_name: metaTag });

      // 2. Custom Event spesifik per admin
      fbq("trackCustom", metaTag);
    }
  }
});