// Render Tim Section
const timElement = document.getElementById("tim");

if (timElement) {
  const timSection = document.createElement("section");
  timSection.className = "py-16 md:py-20 lg:py-32";

  const span = document.createElement("span");
  span.className = "eyebrow reveal";
  span.textContent = "Tim Kami";
  timSection.appendChild(span);

  const h2 = document.createElement("h2");
  h2.id = "team-heading";
  h2.className = "section-h reveal reveal-d1";
  h2.innerHTML = "Sosok di Balik<br />BOSS";
  timSection.appendChild(h2);

  const p = document.createElement("p");
  p.className = "section-p reveal reveal-d2";
  p.textContent =
    "Dibangun oleh talenta lokal yang berdedikasi tinggi dengan satu misi utama: mendigitalisasi dan memajukan UMKM di seluruh wilayah Indonesia.";
  timSection.appendChild(p);

  const div = document.createElement("div");
  div.className = "flex flex-wrap justify-center gap-6 mt-10 md:mt-14";
  timSection.appendChild(div);

  timElement.appendChild(timSection);
  TEAM_MEMBERS.forEach((member) => {
    div.appendChild(
      renderTimCard(
        member.alias,
        member.name,
        member.role,
        member.description,
        member.webPortolio,
      ),
    );
  });
}

function renderTimCard(
  alias = "",
  name = "",
  role = "",
  description = "",
  webPortolio = null,
) {
  const div1 = document.createElement("div");
  div1.className = "w-full md:w-[350px] flex reveal reveal-d1";

  const div2 = document.createElement("div");
  div2.className =
    "bg-surface border border-border-main rounded-3xl p-6 md:p-8 text-left hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 flex flex-col w-full";

  const div3 = document.createElement("div");
  div3.className =
    "w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#e03030] to-[#a81c1c] flex items-center justify-center mb-6 shadow-lg shadow-accent/20";

  const span = document.createElement("span");
  span.className = "font-display text-xl md:text-2xl font-bold text-white";
  span.textContent = alias;

  const h3 = document.createElement("h3");
  h3.className =
    "font-display text-lg md:text-xl font-bold text-text-main mb-1";
  h3.textContent = name;

  const p1 = document.createElement("p");
  p1.className =
    "text-[0.7rem] md:text-xs text-accent font-bold tracking-widest uppercase mb-4";
  p1.textContent = role;

  const p2 = document.createElement("p");
  p2.className = "text-sm text-text2 leading-[1.7] flex-grow";
  p2.textContent = description;

  div1.appendChild(div2);
  div2.appendChild(div3);
  div3.appendChild(span);
  div2.appendChild(h3);
  div2.appendChild(p1);
  div2.appendChild(p2);

  if (webPortolio) {
    const div4 = document.createElement("div");
    div4.className = "mt-6 pt-5 border-t border-border-main";
    div2.appendChild(div4);

    const a = document.createElement("a");
    a.href = webPortolio;
    a.target = "_blank";
    a.className =
      "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-border-main text-xs text-text3 hover:text-text-main hover:bg-surface2 transition-colors w-fit";
    a.rel = "noopener noreferrer";
    a.textContent = webPortolio.slice(8);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.classList.add("w-3.5", "h-3.5");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M14 3h7a1 1 0 011 1v7a1 1 0 11-2 0V6.414l-9.293 9.293a1 1 0 01-1.414-1.414L18.586 5H14a1 1 0 110-2zM5 5h5a1 1 0 110 2H6v12h12v-4a1 1 0 112 0v5a1 1 0 01-1 1H5a1 1 0 110-2z",
    );

    a.appendChild(svg);
    svg.appendChild(path);
    div4.appendChild(a);
  }
  return div1;
}

// Render FAQ Section
const faqElement = document.getElementById("faq");

if (faqElement) {
  const faqSection = document.createElement("section");
  faqSection.className = "py-16 md:py-20 lg:py-32";
  faqSection.setAttribute("aria-labelledby", "faq-heading");

  const span = document.createElement("span");
  span.className = "eyebrow reveal";
  span.textContent = "FAQ";
  faqSection.appendChild(span);

  const h2 = document.createElement("h2");
  h2.id = "faq-heading";
  h2.className = "section-h reveal reveal-d1";
  h2.innerHTML = "Pertanyaan yang<br />Sering Ditanyakan";
  faqSection.appendChild(h2);

  const div = document.createElement("div");
  div.className =
    "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-10 md:mt-14 reveal reveal-d2";

  FAQ_ITEMS.map((item) =>
    div.appendChild(renderFAQCard(item.question, item.answer)),
  );

  faqSection.appendChild(div);
  faqElement.appendChild(faqSection);
}

function renderFAQCard(question = "", answer = "") {
  const div = document.createElement("div");
  div.className =
    "faq-item bg-surface border border-border-main rounded-xl md:rounded-2xl p-5 md:p-6 cursor-pointer transition-colors duration-250";
  div.setAttribute("onclick", "toggleFaq(this)");

  const div2 = document.createElement("div");
  div2.className = "flex justify-between items-center gap-4";

  const span = document.createElement("span");
  span.className = "text-[0.9rem] font-bold leading-[1.4]";
  span.textContent = question;
  div2.appendChild(span);

  const div3 = document.createElement("div");
  div3.className =
    "faq-arrow w-6 h-6 border border-border-main rounded-full flex items-center justify-center shrink-0 transition-all duration-250";
  div3.innerHTML = `<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>`;
  div2.appendChild(div3);

  div.appendChild(div2);

  const div4 = document.createElement("div");
  div4.className =
    "faq-a text-sm text-text2 leading-relaxed max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-out";
  div4.textContent = answer;

  div.appendChild(div4);

  return div;
}

// FAQ Toggle
window.toggleFaq = function (el) {
  const isOpen = el.classList.contains("open");
  document
    .querySelectorAll(".faq-item.open")
    .forEach((f) => f.classList.remove("open"));
  if (!isOpen) el.classList.add("open");
};

// Render Use Case Section
const useCaseElement = document.getElementById("penggunaan");
if (useCaseElement) {
  const useCaseSection = document.createElement("section");
  useCaseSection.className = "py-16 md:py-20 lg:py-32";
  useCaseSection.setAttribute("aria-labelledby", "usecases-heading");

  const span = document.createElement("span");
  span.className = "eyebrow reveal";
  span.textContent = "Penggunaan";
  useCaseSection.appendChild(span);

  const h2 = document.createElement("h2");
  h2.id = "usecases-heading";
  h2.className = "section-h reveal reveal-d1";
  h2.innerHTML = "Siapa Saja yang Bisa<br />Menggunakan BOSS?";
  useCaseSection.appendChild(h2);

  const p = document.createElement("p");
  p.className = "section-p reveal reveal-d2";
  p.textContent =
    "BOSS dirancang untuk fleksibel — dari warung pinggir jalan hingga jaringan restoran modern.";
  useCaseSection.appendChild(p);

  const div = document.createElement("div");
  div.className =
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mt-10 md:mt-14";

  USE_CASE_ITEMS.map((item) =>
    div.appendChild(renderUseCaseCard(item.icon, item.title)),
  );

  useCaseSection.appendChild(div);
  useCaseElement.appendChild(useCaseSection);
}

function renderUseCaseCard(icon, title) {
  const div = document.createElement("div");
  div.className =
    "bg-surface border border-border-main rounded-xl md:rounded-2xl p-5 md:p-6 text-center hover:border-accent/40 hover:-translate-y-1 transition-all duration-300 reveal";

  const div2 = document.createElement("div");
  div2.className =
    "w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3 md:mb-4";
  div2.innerHTML = icon;
  div.appendChild(div2);

  const h3 = document.createElement("h3");
  h3.className =
    "font-display text-[0.85rem] md:text-sm font-bold text-text-main";
  h3.textContent = title;
  div.appendChild(h3);
  return div;
}

// Features Section
const featureElement = document.getElementById("fitur");

if (featureElement) {
  const featureSection = document.createElement("section");
  featureSection.className = "py-16 md:py-20 lg:py-32";
  featureSection.setAttribute("aria-labelledby", "features-heading");

  const span = document.createElement("span");
  span.className = "eyebrow reveal";
  span.textContent = "Fitur Unggulan";
  featureSection.appendChild(span);

  const h2 = document.createElement("h2");
  h2.id = "features-heading";
  h2.className = "section-h reveal reveal-d1";
  h2.innerHTML = "Fitur yang Membuat BOSS<br />Berbeda dari POS Lainnya";
  featureSection.appendChild(h2);

  const p = document.createElement("p");
  p.className = "section-p reveal reveal-d2";
  p.textContent =
    "BOSS bukan sekadar POS biasa — kami menghadirkan fitur inovatif yang benar-benar membantu bisnis Anda tumbuh dan bersaing di era digital.";
  featureSection.appendChild(p);

  FEATURES_ITEMS.map((item) => {
    const featuresLists = item.features ? item.features : [];

    const roleElement = document.createElement("div");
    roleElement.className = "mb-14 md:mb-16 reveal";

    const div1 = document.createElement("div");
    div1.className = "flex items-center gap-3 mb-6 md:mb-8";

    const div2 = document.createElement("div");
    div2.className =
      "w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center";
    div2.innerHTML = item.icon;
    div1.appendChild(div2);

    const h3 = document.createElement("h3");
    h3.className = "font-display text-lg md:text-xl font-bold text-text-main";
    h3.textContent = item.title;
    div1.appendChild(h3);

    const separator = document.createElement("div");
    separator.className =
      "flex-1 h-px bg-gradient-to-r from-accent/20 to-transparent";
    div1.appendChild(separator);

    const lengthFeatureSpan = document.createElement("span");
    lengthFeatureSpan.className = "text-xs text-text3 font-medium";
    lengthFeatureSpan.textContent = `${item.features.length} fitur`;
    div1.appendChild(lengthFeatureSpan);

    const subFeatureWrapper = document.createElement("div");
    subFeatureWrapper.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4";

    featuresLists.forEach((sf) =>
      subFeatureWrapper.appendChild(
        renderFeatureCard(sf.icon, sf.title, sf.description, sf.subFeatures),
      ),
    );

    roleElement.appendChild(div1);
    roleElement.appendChild(subFeatureWrapper);
    featureSection.appendChild(roleElement);
  });

  featureElement.appendChild(featureSection);
}

function renderFeatureCard(
  icon,
  title = "",
  description = "",
  subFeatures = [],
) {
  const div = document.createElement("div");
  div.className =
    "bg-surface p-6 md:p-8 rounded-xl md:rounded-2xl border border-border-main transition-all duration-250 hover:bg-surface2 hover:border-accent/40 relative group";

  const div2 = document.createElement("div");
  div2.className =
    "absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity";
  div.appendChild(div2);

  const div3 = document.createElement("div");
  div3.className =
    "w-11 h-11 rounded-lg md:rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4";
  div3.innerHTML = icon;
  div.appendChild(div3);

  const h3 = document.createElement("h3");
  h3.className = "font-display text-base font-bold mb-2";
  h3.textContent = title;
  div.appendChild(h3);

  const p = document.createElement("p");
  p.className = "text-sm text-text2 leading-relaxed";
  p.textContent = description;
  div.appendChild(p);

  if (subFeatures.length > 0) {
    const divSubfeature = document.createElement("div");
    divSubfeature.className = "flex flex-wrap gap-1.5 mt-3.5";

    subFeatures.forEach((sf) => {
      const span = document.createElement("span");
      span.className =
        "inline-flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded border border-accent/25 text-accent2 bg-accent/10";
      span.textContent = sf;
      divSubfeature.appendChild(span);
    });
    div.appendChild(divSubfeature);
  }

  return div;
}

// Observer untuk Animasi Scroll (Reveal)
const obs = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    }),
  { threshold: 0.07, rootMargin: "0px 0px -40px 0px" },
);
document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
