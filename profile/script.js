const themeToggles = [document.getElementById('theme-toggle'), document.getElementById('theme-toggle-mobile')];
const root = document.documentElement;
const themeIcons = [document.getElementById('theme-icon'), document.getElementById('theme-icon-mobile')];

const ICON_MOON = `<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
const ICON_SUN = `<circle cx="12" cy="12" r="5"></circle><line stroke-linecap="round" stroke-linejoin="round" x1="12" y1="1" x2="12" y2="3"></line><line stroke-linecap="round" stroke-linejoin="round" x1="12" y1="21" x2="12" y2="23"></line><line stroke-linecap="round" stroke-linejoin="round" x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line stroke-linecap="round" stroke-linejoin="round" x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line stroke-linecap="round" stroke-linejoin="round" x1="1" y1="12" x2="3" y2="12"></line><line stroke-linecap="round" stroke-linejoin="round" x1="21" y1="12" x2="23" y2="12"></line><line stroke-linecap="round" stroke-linejoin="round" x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line stroke-linecap="round" stroke-linejoin="round" x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;

function updateThemeIcon(theme) {
    themeIcons.forEach(icon => {
        if (icon) icon.innerHTML = theme === 'light' ? ICON_MOON : ICON_SUN;
    });
}

updateThemeIcon(savedTheme);

function handleThemeToggle() {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Toggle attribute & class secara atomik
    root.setAttribute('data-theme', newTheme);
    root.classList.toggle('dark', newTheme === 'dark');

    localStorage.setItem('boss-theme', newTheme);
    updateThemeIcon(newTheme);

    // Gunakan timeout minimal hanya untuk bypass transisi jika perlu
    root.classList.add('theme-switching');
    setTimeout(() => root.classList.remove('theme-switching'), 10);
}

themeToggles.forEach(toggle => {
    if (toggle) toggle.addEventListener('click', handleThemeToggle);
});

// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20), { passive: true });

// Hamburger
const ham = document.getElementById('hamburger');
const mm = document.getElementById('mobileMenu');
ham.addEventListener('click', () => {
    const isO = ham.classList.toggle('open');
    if (isO) {
        mm.classList.remove('hidden');
        mm.classList.add('flex');
        document.body.style.overflow = 'hidden';
    } else {
        mm.classList.add('hidden');
        mm.classList.remove('flex');
        document.body.style.overflow = '';
    }
    ham.setAttribute('aria-expanded', isO);
});

document.querySelectorAll('.mobile-link').forEach(a => {
    a.addEventListener('click', () => {
        ham.classList.remove('open');
        mm.classList.add('hidden');
        mm.classList.remove('flex');
        document.body.style.overflow = '';
    });
});

// Intersection Observer Reveal
const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
    { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Mockup Tabs
function showMock(id, btn) {
    document.querySelectorAll('.mock-tab').forEach(t => {
        t.className = 'mock-tab px-4 md:px-5 py-2 rounded-full text-[0.83rem] font-semibold border border-border-med bg-transparent text-text2 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200';
    });
    document.querySelectorAll('.browser-mockup').forEach(m => {
        m.classList.add('hidden');
        m.classList.remove('block');
    });

    btn.className = 'mock-tab px-4 md:px-5 py-2 rounded-full text-[0.83rem] font-semibold border transition-all duration-200 bg-accent border-accent text-white shadow-[0_4px_20px_rgba(224,48,48,0.3)] scale-[1.03] active';

    const target = document.getElementById('mock-' + id);
    target.classList.remove('hidden');
    target.classList.add('block');
}

// FAQ Toggle
function toggleFaq(el) {
    const isOpen = el.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(f => f.classList.remove('open'));
    if (!isOpen) el.classList.add('open');
}

// Pricing Logic
const ICON_CHECK = `<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_X = `<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const SUPPORT_LABEL = { EMAIL: 'Dukungan via Email', WHATSAPP: 'Dukungan via WhatsApp', PRIORITY: 'Dukungan Prioritas 24/7' };
const CODE_DESC = {
    TRIAL: 'Cocok untuk mencoba semua fitur dasar BOSS tanpa biaya.',
    BASIC: 'Untuk UMKM yang mulai tumbuh dan butuh lebih banyak kapasitas.',
    PRO: 'Untuk UMKM serius yang ingin skalabilitas penuh tanpa batas.',
};

function featureList(f, code) {
    const items = [
        { label: f.maxOutlets === -1 ? 'Outlet tanpa batas' : `${f.maxOutlets} outlet`, ok: true },
        { label: f.maxStaff === -1 ? 'Staff tanpa batas' : `Maks. ${f.maxStaff} staff`, ok: true },
        { label: f.maxProducts === -1 ? 'Produk tanpa batas' : `Maks. ${f.maxProducts} produk`, ok: true },
        { label: SUPPORT_LABEL[f.supportLevel] || f.supportLevel, ok: true },
        { label: 'Export laporan Excel & email', ok: f.canExportReport },
        { label: 'Pembayaran QRIS & digital', ok: code !== 'TRIAL' },
        { label: 'Sistem komisi staff', ok: code === 'PRO' },
    ];
    return items.map(i =>
        `<div class="flex items-center gap-3 text-[0.875rem] mb-3.5 ${i.ok ? 'text-text2' : 'text-text3'}">
          <div class="${i.ok ? 'text-accent' : 'text-text3'}">${i.ok ? ICON_CHECK : ICON_X}</div>
          ${i.label}
        </div>`
    ).join('');
}

function renderPricing(plans) {
    const grid = document.getElementById('pricing-grid');
    grid.innerHTML = plans.map((plan, idx) => {
        const promoNum = plan.promo ? parseInt(plan.promo, 10) : null;
        const isFree = plan.price === 0;
        const featured = plan.isPopular;
        const desc = CODE_DESC[plan.code] || '';
        const delay = ['', ' reveal-d1', ' reveal-d2'][idx] || '';

        let priceHTML;
        if (isFree) {
            priceHTML = `<div class="mb-4">
            <div class="font-display flex items-end gap-1.5">
              <span class="text-[2.5rem] md:text-[3rem] font-extrabold leading-none tracking-tight">Gratis</span>
              <span class="text-sm text-text2 font-medium font-body pb-1.5">/${plan.durationDays} hari</span>
            </div>
          </div>`;
        } else if (promoNum) {
            priceHTML = `<div class="mb-4">
            <div class="text-[0.95rem] text-text3 line-through font-medium font-body mb-1">Rp ${(plan.price / 1000).toLocaleString('id-ID')}rb</div>
            <div class="font-display flex items-end gap-1">
              <span class="text-lg font-bold font-body pb-1.5 md:pb-2">Rp</span>
              <span class="text-[2.5rem] md:text-[3rem] font-extrabold leading-none tracking-tight">${(promoNum / 1000).toLocaleString('id-ID')}</span>
              <span class="text-sm text-text2 font-medium font-body pb-1.5">rb/bln</span>
            </div>
          </div>`;
        } else {
            priceHTML = `<div class="mb-4">
            <div class="font-display flex items-end gap-1">
              <span class="text-lg font-bold font-body pb-1.5 md:pb-2">Rp</span>
              <span class="text-[2.5rem] md:text-[3rem] font-extrabold leading-none tracking-tight">${(plan.price / 1000).toLocaleString('id-ID')}</span>
              <span class="text-sm text-text2 font-medium font-body pb-1.5">rb/bln</span>
            </div>
          </div>`;
        }

        const ctaBtn = isFree
            ? `<a href="https://dashboard.bossapp.id/auth/register" class="btn bg-black/5 border border-border-main hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-white/20 text-text-main w-full justify-center">Mulai Gratis</a>`
            : `<a href="https://dashboard.bossapp.id/auth/register" class="btn btn-primary w-full justify-center">${promoNum ? 'Coba Sekarang — Hemat!' : 'Pilih Paket Ini'}</a>`;

        const cardClasses = featured
            ? `bg-surface2 border border-accent/50 rounded-2xl md:rounded-[2rem] p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(224,48,48,0.15)] relative bg-[radial-gradient(circle_at_top_right,rgba(224,48,48,0.15),transparent_60%)] flex flex-col h-full`
            : `bg-surface border border-border-main rounded-2xl md:rounded-[2rem] p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:border-accent/40 relative flex flex-col h-full`;

        const badgeHTML = featured
            ? `<div class="inline-flex text-[0.72rem] font-extrabold px-3 py-1 rounded-full bg-accent text-white uppercase tracking-[1px] mb-5 w-fit">Paling Populer</div>`
            : `<div class="h-[26px] mb-5"></div>`;

        return `<div class="${cardClasses} reveal${delay}">
          ${badgeHTML}
          <div class="font-display text-xl font-extrabold mb-3 text-text-main">${plan.name}</div>
          ${priceHTML}
          <div class="text-[0.875rem] text-text2 mb-6 leading-[1.6]">${desc}</div>
          <div class="h-px bg-border-main mb-6 w-full"></div>
          <div class="flex-grow">
            ${featureList(plan.features, plan.code)}
          </div>
          <div class="mt-8">${ctaBtn}</div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

(async () => {
    try {
        const response = await fetch('https://api.bossapp.id/api/v1/subscription-plans');
        const jsonResponse = await response.json();
        if (jsonResponse.success) {
            renderPricing(jsonResponse.data.filter(p => p.isActive));
        }
    } catch (err) {
        document.getElementById('pricing-grid').style.display = 'none';
        const errEl = document.getElementById('pricing-error');
        errEl.classList.remove('hidden');
        errEl.classList.add('block');
        errEl.textContent = 'Gagal memuat paket harga. Silakan refresh halaman.';
    }
})();