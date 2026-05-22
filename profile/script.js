function el(tag, className = "", textContent = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

function svgEl(tag, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
  return element;
}

const themeToggles = [
  document.getElementById("theme-toggle"),
  document.getElementById("theme-toggle-mobile"),
];

const root = document.documentElement;

const themeIcons = [
  document.getElementById("theme-icon"),
  document.getElementById("theme-icon-mobile"),
];

function createThemeIcon(theme) {
  const fragment = document.createDocumentFragment();
  if (theme === "light") {
    // Moon Icon
    fragment.appendChild(
      svgEl("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
      }),
    );
  } else {
    // Sun Icon
    fragment.appendChild(svgEl("circle", { cx: "12", cy: "12", r: "5" }));
    const lines = [
      [12, 1, 12, 3],
      [12, 21, 12, 23],
      [4.22, 4.22, 5.64, 5.64],
      [18.36, 18.36, 19.78, 19.78],
      [1, 12, 3, 12],
      [21, 12, 23, 12],
      [4.22, 19.78, 5.64, 18.36],
      [18.36, 5.64, 19.78, 4.22],
    ];
    lines.forEach((c) => {
      fragment.appendChild(
        svgEl("line", {
          x1: c[0],
          y1: c[1],
          x2: c[2],
          y2: c[3],
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
      );
    });
  }
  return fragment;
}

function updateThemeIcon(theme) {
  themeIcons.forEach((icon) => {
    if (!icon) return;
    while (icon.firstChild) icon.removeChild(icon.firstChild);
    icon.appendChild(createThemeIcon(theme));
  });
}

updateThemeIcon(savedTheme); // Initialize on load

function handleThemeToggle() {
  const currentTheme = root.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  root.setAttribute("data-theme", newTheme);
  root.classList.toggle("dark", newTheme === "dark");

  localStorage.setItem("boss-theme", newTheme);
  updateThemeIcon(newTheme);

  root.classList.add("theme-switching");
  setTimeout(() => root.classList.remove("theme-switching"), 10);
}

themeToggles.forEach((toggle) => {
  if (toggle) toggle.addEventListener("click", handleThemeToggle);
});

const nav = document.getElementById("nav");
window.addEventListener(
  "scroll",
  () => nav.classList.toggle("scrolled", scrollY > 20),
  { passive: true },
);

const ham = document.getElementById("hamburger");
const mm = document.getElementById("mobileMenu");
ham.addEventListener("click", () => {
  const isO = ham.classList.toggle("open");
  if (isO) {
    mm.classList.remove("hidden");
    mm.classList.add("flex");
    document.body.style.overflow = "hidden";
  } else {
    mm.classList.add("hidden");
    mm.classList.remove("flex");
    document.body.style.overflow = "";
  }
  ham.setAttribute("aria-expanded", isO);
});

document.querySelectorAll(".mobile-link").forEach((a) => {
  a.addEventListener("click", () => {
    ham.classList.remove("open");
    mm.classList.add("hidden");
    mm.classList.remove("flex");
    document.body.style.overflow = "";
  });
});

// Mockup Tabs
window.showMock = function (id, btn) {
  document.querySelectorAll(".mock-tab").forEach((t) => {
    t.className =
      "mock-tab px-4 md:px-5 py-2 rounded-full text-[0.83rem] font-semibold border border-border-med bg-transparent text-text2 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200";
  });
  document.querySelectorAll(".browser-mockup").forEach((m) => {
    m.classList.add("hidden");
    m.classList.remove("block");
  });

  btn.className =
    "mock-tab px-4 md:px-5 py-2 rounded-full text-[0.83rem] font-semibold border transition-all duration-200 bg-accent border-accent text-white shadow-[0_4px_20px_rgba(224,48,48,0.3)] scale-[1.03] active";

  const target = document.getElementById("mock-" + id);
  target.classList.remove("hidden");
  target.classList.add("block");
};

// --- PRICING LOGIC (PURE DOM) ---
const SUPPORT_LABEL = {
  EMAIL: "Dukungan via Email",
  WHATSAPP: "Dukungan via WhatsApp",
  PRIORITY: "Dukungan Prioritas 24/7",
};
const CODE_DESC = {
  TRIAL: "Cocok untuk mencoba semua fitur dasar BOSS tanpa biaya.",
  BASIC: "Untuk UMKM yang mulai tumbuh dan butuh lebih banyak kapasitas.",
  PRO: "Untuk UMKM serius yang ingin skalabilitas penuh, analitik mendalam, dan tools finansial.",
};

function createCheckCrossIcon(isCheck) {
  const svg = svgEl("svg", {
    class: "w-4 h-4 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

  if (isCheck) {
    svg.appendChild(svgEl("polyline", { points: "20 6 9 17 4 12" }));
  } else {
    svg.appendChild(svgEl("line", { x1: "18", y1: "6", x2: "6", y2: "18" }));
    svg.appendChild(svgEl("line", { x1: "6", y1: "6", x2: "18", y2: "18" }));
  }
  return svg;
}

function renderPricing(plans) {
  const grid = document.getElementById("pricing-grid");
  // Kosongkan loading skeleton
  while (grid.firstChild) grid.removeChild(grid.firstChild);

  plans.forEach((plan, idx) => {
    const promoNum = plan.promo ? parseInt(plan.promo, 10) : null;
    const isFree = plan.price === 0;
    const featured = plan.isPopular;
    const desc = CODE_DESC[plan.code] || "Paket untuk kebutuhan bisnis Anda.";
    const delayClass = ["", "reveal-d1", "reveal-d2"][idx] || "";

    // Card Container
    const cardClasses = featured
      ? `bg-surface2 border border-accent/50 rounded-2xl md:rounded-[2rem] p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(224,48,48,0.15)] relative bg-[radial-gradient(circle_at_top_right,rgba(224,48,48,0.15),transparent_60%)] flex flex-col h-full reveal ${delayClass}`
      : `bg-surface border border-border-main rounded-2xl md:rounded-[2rem] p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:border-accent/40 relative flex flex-col h-full reveal ${delayClass}`;
    const card = el("div", cardClasses);

    // Badge / Spacer
    if (featured) {
      card.appendChild(
        el(
          "div",
          "inline-flex text-[0.72rem] font-extrabold px-3 py-1 rounded-full bg-accent text-white uppercase tracking-[1px] mb-5 w-fit",
          "Paling Populer",
        ),
      );
    } else {
      card.appendChild(el("div", "h-[26px] mb-5"));
    }

    // Title
    card.appendChild(
      el(
        "div",
        "font-display text-xl font-extrabold mb-3 text-text-main",
        plan.name,
      ),
    );

    // Price Block
    const priceContainer = el("div", "mb-4");
    const priceFlex = el("div", "font-display flex items-end gap-1.5");

    if (isFree) {
      priceFlex.appendChild(
        el(
          "span",
          "text-[2.5rem] md:text-[3rem] font-extrabold leading-none tracking-tight",
          "Gratis",
        ),
      );
      priceFlex.appendChild(
        el(
          "span",
          "text-sm text-text2 font-medium font-body pb-1.5",
          `/${plan.durationDays} hari`,
        ),
      );
    } else if (promoNum) {
      const strike = el(
        "div",
        "text-[0.95rem] text-text3 line-through font-medium font-body mb-1",
        `Rp ${(plan.price / 1000).toLocaleString("id-ID")}rb`,
      );
      priceContainer.appendChild(strike);
      priceFlex.classList.replace("gap-1.5", "gap-1");
      priceFlex.appendChild(
        el("span", "text-lg font-bold font-body pb-1.5 md:pb-2", "Rp"),
      );
      priceFlex.appendChild(
        el(
          "span",
          "text-[2.5rem] md:text-[3rem] font-extrabold leading-none tracking-tight",
          (promoNum / 1000).toLocaleString("id-ID"),
        ),
      );
      priceFlex.appendChild(
        el("span", "text-sm text-text2 font-medium font-body pb-1.5", "rb/bln"),
      );
    } else {
      priceFlex.classList.replace("gap-1.5", "gap-1");
      priceFlex.appendChild(
        el("span", "text-lg font-bold font-body pb-1.5 md:pb-2", "Rp"),
      );
      priceFlex.appendChild(
        el(
          "span",
          "text-[2.5rem] md:text-[3rem] font-extrabold leading-none tracking-tight",
          (plan.price / 1000).toLocaleString("id-ID"),
        ),
      );
      priceFlex.appendChild(
        el("span", "text-sm text-text2 font-medium font-body pb-1.5", "rb/bln"),
      );
    }
    priceContainer.appendChild(priceFlex);
    card.appendChild(priceContainer);

    // Description & Divider
    card.appendChild(
      el("div", "text-[0.875rem] text-text2 mb-6 leading-[1.6]", desc),
    );
    card.appendChild(el("div", "h-px bg-border-main mb-6 w-full"));

    // Features List
    const f = plan.features;
    const featuresDiv = el("div", "flex-grow");
    const itemsList = [
      {
        label:
          f.maxOutlets === -1 ? "Outlet tanpa batas" : `${f.maxOutlets} outlet`,
        ok: true,
      },
      {
        label:
          f.maxStaff === -1 ? "Staff tanpa batas" : `Maks. ${f.maxStaff} staff`,
        ok: true,
      },
      {
        label:
          f.maxProducts === -1
            ? "Produk tanpa batas"
            : `Maks. ${f.maxProducts} produk`,
        ok: true,
      },
      { label: SUPPORT_LABEL[f.supportLevel] || f.supportLevel, ok: true },
      { label: "Export laporan Excel & email", ok: f.canExportReport },
      { label: "Pembayaran QRIS & digital", ok: plan.code !== "TRIAL" },
      {
        label: "Analitik Kesehatan Bisnis & Laba Rugi",
        ok: plan.code === "PRO",
      },
      { label: "Tools HPP, BEP & Target Sales", ok: plan.code === "PRO" },
    ];

    itemsList.forEach((i) => {
      const row = el(
        "div",
        `flex items-center gap-3 text-[0.875rem] mb-3.5 ${i.ok ? "text-text2" : "text-text3"}`,
      );
      const iconDiv = el("div", i.ok ? "text-accent" : "text-text3");
      iconDiv.appendChild(createCheckCrossIcon(i.ok));
      row.appendChild(iconDiv);
      row.appendChild(document.createTextNode(i.label));
      featuresDiv.appendChild(row);
    });
    card.appendChild(featuresDiv);

    // CTA Button
    const ctaContainer = el("div", "mt-8");
    const btnClass = isFree
      ? "btn bg-black/5 border border-border-main hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-white/20 text-text-main w-full justify-center"
      : "btn btn-primary w-full justify-center";

    const ctaBtn = el(
      "a",
      btnClass,
      isFree
        ? "Mulai Gratis"
        : promoNum
          ? "Coba Sekarang — Hemat!"
          : "Pilih Paket Ini",
    );
    ctaBtn.href = "https://dashboard.bossapp.id/auth/register";

    ctaContainer.appendChild(ctaBtn);
    card.appendChild(ctaContainer);

    grid.appendChild(card);
    obs.observe(card);
  });
}

(async () => {
  try {
    const response = await fetch(
      "https://api.bossapp.id/api/v1/subscription-plans",
    );
    const jsonResponse = await response.json();
    if (jsonResponse.success) {
      renderPricing(jsonResponse.data.filter((p) => p.isActive));
    }
  } catch (err) {
    document.getElementById("pricing-grid").style.display = "none";
    const errEl = document.getElementById("pricing-error");
    errEl.classList.remove("hidden");
    errEl.classList.add("block");
    errEl.textContent = "Gagal memuat paket harga. Silakan refresh halaman.";

    // Fallback dummy data jika tidak bisa fetch (untuk keperluan testing lokal)
    const dummyData = [
      {
        code: "TRIAL",
        name: "Trial",
        price: 0,
        durationDays: 35,
        isPopular: false,
        features: {
          maxOutlets: 1,
          maxStaff: 2,
          maxProducts: 50,
          supportLevel: "EMAIL",
          canExportReport: false,
        },
      },
      {
        code: "BASIC",
        name: "Basic",
        price: 99000,
        durationDays: 30,
        isPopular: false,
        features: {
          maxOutlets: 2,
          maxStaff: -1,
          maxProducts: -1,
          supportLevel: "WHATSAPP",
          canExportReport: true,
        },
      },
      {
        code: "PRO",
        name: "Pro",
        price: 149000,
        promo: 129000,
        durationDays: 30,
        isPopular: true,
        features: {
          maxOutlets: -1,
          maxStaff: -1,
          maxProducts: -1,
          supportLevel: "PRIORITY",
          canExportReport: true,
        },
      },
    ];
    renderPricing(dummyData);
    document.getElementById("pricing-grid").style.display = "grid";
    errEl.classList.add("hidden");
  }
})();
