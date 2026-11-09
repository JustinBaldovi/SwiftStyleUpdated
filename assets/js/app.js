/* Swift Style PH — Shared App Logic. Data (accounts, catalog, cart, orders) lives in Supabase via assets/js/db.js. */

const IMG_PLACEHOLDER = 'assets/img/placeholder.svg';

/* ---------------- Helpers ---------------- */
function formatPrice(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getProductById(id) {
  return PRODUCTS.find(p => p.id === Number(id));
}
function getCategoryBySlug(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}
/* Colour swatches (used for the colour chips on the product page) */
const COLOR_HEX = {
  'Black': '#1d1d21', 'Navy': '#1f2d5c', 'Maroon': '#6e1527', 'Gray': '#8b8e94',
  'Olive': '#6a6b2f', 'Natural': '#e6d9bb', 'Red': '#c8222c', 'Brown': '#6a4128',
  'Dark Gray': '#4b4e54', 'Beige': '#d9c5a3', 'Pink': '#f19dbb', 'White': '#f6f6f3',
  'Blush': '#eec2c0', 'Taupe': '#9a8777', 'Yellow': '#f6c730', 'Sky Blue': '#6cc0ea',
  'Blue': '#2a62c8', 'Green': '#2f9d5a'
};
function normalizeColorName(color) {
  return String(color || '').trim().replace(/\s+/g, ' ').toLowerCase();
}
function savedProductColorHex(colorHexes, color) {
  const key = normalizeColorName(color);
  if (!colorHexes || !key) return '';
  const matchedKey = Object.keys(colorHexes).find(function (name) {
    return normalizeColorName(name) === key;
  });
  const hex = matchedKey ? String(colorHexes[matchedKey]).trim() : '';
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : '';
}
function productColorHex(product, color) {
  const saved = savedProductColorHex(product.colorHexes, color);
  if (saved) return saved;
  const key = normalizeColorName(color);
  const defaultName = Object.keys(COLOR_HEX).find(function (name) {
    return normalizeColorName(name) === key;
  });
  return defaultName ? COLOR_HEX[defaultName] : '#cccccc';
}
/* Use one product photo; the selected color is represented by its exact hex swatch. */
function productImage(p) {
  if (!p.image) return IMG_PLACEHOLDER;
  if (/^https?:\/\//i.test(p.image) || p.image.indexOf('product-images/') === 0) return p.image;
  return 'assets/img/' + p.image;
}
function productBaseImage(p) {
  if (!p.image) return IMG_PLACEHOLDER;
  return /^https?:\/\//i.test(p.image) ? p.image : 'assets/img/' + p.image;
}
function productImgClass(p) {
  return p.fit === 'contain' ? ' class="fit-contain"' : '';
}
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
function validGender(param) {
  const map = { men: 'Men', women: 'Women', children: 'Children' };
  return map[(param || '').toLowerCase()] || null;
}

/* ---------------- Page start-up (Supabase) ----------------
   Every page that shows products/cart/orders runs its code through appReady():
   it checks there is a valid Supabase session (else -> login.html), loads the catalog
   from the database into PRODUCTS / CATEGORIES, then runs your function.
   Cart + orders now live in Supabase (see assets/js/db.js, SSPH_DB.cart*, placeOrder). */
function appReady(fn) {
  const run = async function () {
    if (!(await SSPH_DB.requireSession('login.html?redirect=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)))) return;
    const r = await SSPH_DB.loadCatalog();
    if (!r.ok) {
      const main = document.querySelector('main') || document.body;
      main.innerHTML = '<section class="section container"><p class="empty-state">Could not load the shop right now: ' +
        escapeHtml(r.error) + '</p></section>';
      return;
    }
    await SSPH_DB.getProfile();           // refresh the name shown in the header
    renderHeader();
    fn();
    var watch = await SSPH_DB.watchCatalog(async function () {
      var update = await SSPH_DB.loadCatalog();
      if (!update.ok) {
        console.error('[Catalog] Could not refresh products:', update.error);
        return;
      }
      window.dispatchEvent(new CustomEvent('ssph:catalog-updated'));
    }, function (status, error) {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('[Catalog] Live updates disconnected:', error || status);
      }
    });
    if (!watch.ok) console.error('[Catalog] Live updates unavailable:', watch.error);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
}

/* ---------------- Auth (Supabase Auth — see assets/js/db.js) ----------------
   Every account is identified by a provider + id pair, so an email account,
   a Facebook (Gmail) account and an Instagram (username) account never
   collide with each other:
     email     -> id = email address
     facebook  -> id = Gmail address
     instagram -> id = username (no @)
   Sign Up creates an account only if that provider+id does not exist yet.
   Log In only works for an account that was already signed up. */
const PROVIDER_LABEL = { email: 'Email', facebook: 'Facebook', instagram: 'Instagram' };

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Validate + normalise an identifier for its provider's own format.
   Returns { ok:true, id } or { ok:false, error }. */
function normalizeIdentifier(provider, raw) {
  let v = String(raw || '').trim();
  if (provider === 'instagram') {
    v = v.replace(/^@/, '').toLowerCase();
    // Instagram rules: 1-30 chars, letters/numbers/periods/underscores,
    // no leading/trailing period, no two periods in a row.
    if (!/^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{1,30}$/.test(v)) {
      return { ok: false, error: 'Enter a valid Instagram username (letters, numbers, periods and underscores only, up to 30 characters — no spaces or @ needed).' };
    }
    return { ok: true, id: v };
  }
  v = v.toLowerCase();
  if (provider === 'facebook') {
    if (!/^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?@gmail\.com$/.test(v)) {
      return { ok: false, error: 'Facebook uses a Gmail address. Enter it like yourname@gmail.com.' };
    }
    return { ok: true, id: v };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { ok: false, error: 'Enter a valid email address (like name@example.com).' };
  }
  return { ok: true, id: v };
}

/* The signed-in user's details, mirrored into localStorage by SSPH_DB.getProfile()
   (used by gate.js and the header). The real session lives in Supabase. */
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('ssph_current_user') || 'null'); } catch (e) { return null; }
}

/* ----- Email ----- */
async function registerUser(fullName, email, phone, address, password) {
  return SSPH_DB.signUp('email', email, password, { fullName: fullName, phone: phone, address: address });
}
async function loginUser(email, password) {
  return SSPH_DB.signIn('email', email, password);
}

/* Only allow redirects to pages inside this site (blocks open redirects). */
function safeRedirect(target) {
  return /^[a-z0-9_\-]+\.html(\?[^\s]*)?$/i.test(target || '') ? target : 'index.html';
}

/* ----- Facebook (Gmail) / Instagram (username) -----
   DEMO — see README. A real version needs a Meta OAuth app; here the provider account is
   simulated: the Gmail / username + password become a normal Supabase Auth account.
   mode = 'signup' (create once) or 'login' (must already exist). */
async function socialAuth(provider, rawId, password, mode, confirm) {
  password = password || '';
  if (mode === 'signup') {
    const n = normalizeIdentifier(provider, rawId);
    if (!n.ok) return n;
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };
    const r = await SSPH_DB.signUp(provider, rawId, password);
    if (!r.ok && r.exists) {
      const shown = provider === 'instagram' ? '@' + n.id : n.id;
      r.error = PROVIDER_LABEL[provider] + ' account ' + shown + ' is already registered. Please Log In instead.';
    }
    return r;
  }
  return SSPH_DB.signIn(provider, rawId, password);
}

/* mode: 'signup' or 'login' — decides what the buttons/modal do. */
function renderSocialButtons(containerId, mode) {
  const el = document.getElementById(containerId);
  if (!el) return;
  mode = mode === 'login' ? 'login' : 'signup';
  const verb = mode === 'login' ? 'Log in' : 'Sign up';
  el.innerHTML = `
    <div class="social-divider"><span>or ${verb.toLowerCase()} with</span></div>
    <button type="button" class="social-btn social-fb" data-provider="facebook"><b>f</b> ${verb} with Facebook</button>
    <button type="button" class="social-btn social-ig" data-provider="instagram"><b>◎</b> ${verb} with Instagram</button>`;
  el.querySelectorAll('.social-btn').forEach(function (b) {
    b.addEventListener('click', function () { openSocialModal(b.dataset.provider, mode); });
  });
}

function openSocialModal(provider, mode) {
  const isFb = provider === 'facebook';
  const isLogin = mode === 'login';
  const label = PROVIDER_LABEL[provider];
  const otherPage = isLogin ? 'register.html' : 'login.html';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>${isLogin ? 'Log in' : 'Sign up'} with ${label}</h3>
      <p class="form-note" style="margin:0 0 14px;">${isFb
        ? 'Enter the Gmail address and password of your Facebook account.'
        : 'Enter the username and password of your Instagram account.'}</p>
      <p class="modal-error" style="display:none;"></p>
      <form novalidate>
        <div class="form-group"><label>${isFb ? 'Gmail Address' : 'Instagram Username'}</label>
          <input type="${isFb ? 'email' : 'text'}" name="id" autocomplete="off" autocapitalize="none" spellcheck="false"
                 placeholder="${isFb ? 'yourname@gmail.com' : '@swiftstyle.ph'}" required></div>
        <div class="form-group"><label>Password</label>
          <input type="password" name="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required></div>
        ${isLogin ? '' : '<div class="form-group"><label>Confirm Password</label><input type="password" name="confirm" autocomplete="new-password" required></div>'}
        <button type="submit" class="btn btn-block">${isLogin ? 'Log In' : 'Sign Up'}</button>
        <button type="button" class="btn btn-secondary btn-block modal-cancel" style="margin-top:10px;">Cancel</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('input[name="id"]');
  input.focus();
  overlay.querySelector('.modal-cancel').addEventListener('click', function () { overlay.remove(); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    const submitBtn = f.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const result = await socialAuth(provider, input.value, f.password.value, mode, f.confirm ? f.confirm.value : '');
    submitBtn.disabled = false;
    if (result.ok) {
      window.location.href = safeRedirect(qs('redirect'));
    } else {
      const err = overlay.querySelector('.modal-error');
      err.textContent = result.error;
      err.style.display = 'block';
    }
  });
}

/* ---------------- Header / Footer (rendered by JS on every page) ---------------- */
function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const user = getCurrentUser();
  const count = 0;   // filled in from Supabase just below

  if (!user) {
    // Signed-out visitors only see the logo — no navigation until they log in.
    el.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <a href="login.html" class="logo">Swift Style <span>PH</span></a>
      </div>
    </header>`;
    return;
  }

  el.innerHTML = `
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="logo">Swift Style <span>PH</span></a>
      <nav class="main-nav">
        <a href="index.html">Home</a>
        <a href="shop.html">Shop</a>
        <a href="orders.html">My Orders</a>
        <a href="owner.html">Owner Dashboard</a>
        <div class="dropdown">
          <span>Categories ▾</span>
          <div class="dropdown-menu category-mega-menu">
            <div class="gender-tabs">
              <button type="button" class="gender-tab active" data-gender="men">Men</button>
              <button type="button" class="gender-tab" data-gender="women">Women</button>
              <button type="button" class="gender-tab" data-gender="children">Children</button>
            </div>
            <div class="gender-subcats" id="gender-subcats"></div>
          </div>
        </div>
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact Us</a>
      </nav>
      <div class="nav-actions">
        <a href="cart.html" class="cart-link">🛒 Cart<span class="cart-badge">${count}</span></a>
        <div class="profile-menu">
          <button type="button" class="profile-trigger" id="profile-trigger" aria-expanded="false"
            aria-controls="profile-dropdown" aria-haspopup="true"
            aria-label="Profile menu for ${escapeHtml(user.fullName || 'your account')}">
            <span class="profile-avatar" aria-hidden="true">${escapeHtml((user.fullName || 'U').trim().charAt(0).toUpperCase())}</span>
            <span class="profile-trigger-label">Hi, ${escapeHtml((user.fullName || '').trim().split(/\s+/)[0] || 'there')}</span>
            <span class="profile-chevron" aria-hidden="true">⌄</span>
          </button>
          <div class="profile-dropdown" id="profile-dropdown" hidden>
            <span class="profile-dropdown-name">${escapeHtml(user.fullName || 'Your account')}</span>
            <button type="button" id="logout-link" class="profile-logout">Log out</button>
          </div>
        </div>
      </div>
    </div>
  </header>`;

  const badge = el.querySelector('.cart-badge');
  if (badge) SSPH_DB.cartCount().then(function (n) { badge.textContent = n; });

  const profileTrigger = el.querySelector('#profile-trigger');
  const profileDropdown = el.querySelector('#profile-dropdown');
  if (profileTrigger && profileDropdown) {
    function setProfileMenuOpen(open) {
      profileDropdown.hidden = !open;
      profileTrigger.setAttribute('aria-expanded', String(open));
      profileTrigger.classList.toggle('is-open', open);
    }
    if (el._profileMenuOutside) document.removeEventListener('click', el._profileMenuOutside);
    if (el._profileMenuKeydown) document.removeEventListener('keydown', el._profileMenuKeydown);
    profileTrigger.addEventListener('click', function () {
      setProfileMenuOpen(profileDropdown.hidden);
    });
    el._profileMenuOutside = function (event) {
      if (!el.contains(event.target)) setProfileMenuOpen(false);
    };
    el._profileMenuKeydown = function (event) {
      if (event.key === 'Escape' && !profileDropdown.hidden) {
        setProfileMenuOpen(false);
        profileTrigger.focus();
      }
    };
    document.addEventListener('click', el._profileMenuOutside);
    document.addEventListener('keydown', el._profileMenuKeydown);
    const header = el.querySelector('.site-header');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (header && !motionPreference.matches) {
      header.addEventListener('pointermove', function (event) {
        const bounds = header.getBoundingClientRect();
        header.style.setProperty('--pointer-x', ((event.clientX - bounds.left) / bounds.width * 100) + '%');
        header.style.setProperty('--pointer-y', ((event.clientY - bounds.top) / bounds.height * 100) + '%');
        header.style.setProperty('--parallax-x', ((event.clientX - bounds.left - bounds.width / 2) / bounds.width * -10) + 'px');
        header.style.setProperty('--parallax-y', ((event.clientY - bounds.top - bounds.height / 2) / bounds.height * -5) + 'px');
      });
      header.addEventListener('pointerleave', function () {
        header.style.setProperty('--pointer-x', '50%');
        header.style.setProperty('--pointer-y', '50%');
        header.style.setProperty('--parallax-x', '0px');
        header.style.setProperty('--parallax-y', '0px');
      });
    }
  }

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', async function () {
      logoutLink.disabled = true;
      logoutLink.textContent = 'Signing out…';
      const result = await SSPH_DB.signOut();
      if (!result.ok) {
        console.error('[Auth] Could not sign out:', result.error);
        logoutLink.disabled = false;
        logoutLink.textContent = 'Log out';
        return;
      }
      window.location.href = 'login.html';
    });
  }

  // Gender tab mega-menu behavior
  const subcatsContainer = document.getElementById('gender-subcats');
  function renderSubcats(gender) {
    subcatsContainer.innerHTML = SUBCATS_BY_GENDER[gender].map(function (c) {
      return '<a href="category.html?gender=' + gender + '&slug=' + c.slug + '">' + c.name + '</a>';
    }).join('');
  }
  document.querySelectorAll('.gender-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.gender-tab').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderSubcats(btn.dataset.gender);
    });
  });
  renderSubcats('men');
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-col">
        <h3>Swift Style <span>PH</span></h3>
        <p>Carry What Matters.</p>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <a href="shop.html">All Bags</a>
        <a href="category.html?gender=men&slug=backpacks">Backpacks</a>
        <a href="category.html?gender=men&slug=tote-bags">Tote Bags</a>
        <a href="category.html?gender=men&slug=sling-bags">Sling Bags</a>
        <a href="category.html?gender=men&slug=laptop-bags">Laptop Bags</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact Us</a>
      </div>
      <div class="footer-col">
        <h4>Follow Us</h4>
        <p>Facebook: /SwiftStylePH</p>
        <p>Instagram: @swiftstyle.ph</p>
        <p>Email: hello@swiftstyleph.com</p>
      </div>
    </div>
    <p class="copyright">&copy; ${new Date().getFullYear()} Swift Style PH. All rights reserved.</p>
  </footer>`;
}

/* ---------------- Product card / grid rendering ---------------- */
function productCardHTML(p) {
  return `
  <div class="product-card">
    <a href="product.html?id=${p.id}">
      <div class="product-thumb"><img src="${escapeHtml(productImage(p))}" data-fallback-src="${escapeHtml(productBaseImage(p))}"${productImgClass(p)} alt="${escapeHtml(p.name)}"></div>
    </a>
    <div class="product-info">
      ${p.isNew ? '<span class="product-badge">NEW</span>' : ''}
      <h3><a href="product.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
      <div class="product-price">${formatPrice(p.price)}</div>
      ${p.colors && p.colors.length ? '<div class="product-card-colors" aria-label="Available colors">' +
        p.colors.map(function (color) {
          return '<span class="product-card-swatch" title="' + escapeHtml(color) +
            '" aria-label="' + escapeHtml(color) + '" style="background-color:' +
            escapeHtml(productColorHex(p, color)) + '"></span>';
        }).join('') + '</div>' : ''}
      ${Number(p.stock) > 0 ? '<small class="product-stock">' + Number(p.stock) + ' in stock</small>' : '<small class="product-stock out-of-stock">Out of stock</small>'}
      <div class="product-actions">
        <a href="product.html?id=${p.id}" class="btn btn-secondary btn-block">View Product</a>
      </div>
    </div>
  </div>`;
}
function renderProductGrid(containerId, products) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = products.length
    ? products.map(productCardHTML).join('')
    : '<p class="empty-state">No bags found.</p>';
  el.querySelectorAll('img[data-fallback-src]').forEach(function (image) {
    var fallbackImage = function () {
      image.removeEventListener('error', fallbackImage);
      if (image.src !== new URL(image.dataset.fallbackSrc, document.baseURI).href) {
        image.src = image.dataset.fallbackSrc;
      }
    };
    image.addEventListener('error', fallbackImage);
  });
}
function sortProducts(list, sort) {
  const copy = list.slice();
  if (sort === 'price_asc') copy.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') copy.sort((a, b) => b.price - a.price);
  else if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  else copy.sort((a, b) => b.id - a.id); // newest
  return copy;
}

/* Run header/footer on every page load */
document.addEventListener('DOMContentLoaded', function () {
  renderHeader();
  renderFooter();
  if (window.SSPH_DB) {
    var previousUser = getCurrentUser();
    SSPH_DB.getProfile().then(function (result) {
      if (!result.ok) {
        if (result.error !== 'Not signed in.') {
          console.error('[Auth] Could not refresh the signed-in profile:', result.error);
        }
        return;
      }

      var profile = result.data;
      if (!previousUser ||
          previousUser.role !== profile.role ||
          previousUser.fullName !== profile.full_name ||
          previousUser.email !== profile.email) {
        renderHeader();
      }
    });
  }
});
