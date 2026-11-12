/* Swift Style PH — Supabase data layer (replaces the localStorage "database").

   Load order on every page (before your page script):
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
     <script src="assets/js/supabase-config.js"></script>
     <script src="assets/js/data.js"></script>
     <script src="assets/js/app.js"></script>     <- provides normalizeIdentifier(), formatPrice() ...
     <script src="assets/js/db.js"></script>

   Every function is async and returns { ok:true, data } or { ok:false, error }.
   Row Level Security in Supabase is what actually protects the data; this file
   only talks to it. */
(function () {
  'use strict';

  var cfg = window.SSPH_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || /YOUR-PROJECT-REF/.test(cfg.SUPABASE_URL)) {
    console.error('[SSPH_DB] Supabase is not configured. Fill in assets/js/supabase-config.js.');
  }
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  function fail(error) {
    var msg = (error && error.message) ? error.message : String(error || 'Something went wrong.');
    return { ok: false, error: msg };
  }
  function ok(data) { return { ok: true, data: data }; }

  /* ---------------------------------------------------------------
     Login identity -> internal Supabase auth email.
     MUST match public.auth_email_for() in supabase/01_schema.sql.
       email     name@example.com -> name@example.com
       facebook  name@gmail.com   -> name_at_gmail.com@facebook.local
       instagram my.user          -> my.user@instagram.local
     `id` must already be normalised (see normalizeIdentifier in app.js). */
  function authEmailFor(provider, id) {
    id = String(id).toLowerCase();
    if (provider === 'facebook')  return id.replace('@', '_at_') + '@facebook.local';
    if (provider === 'instagram') return id + '@instagram.local';
    return id;
  }

  /* ---------------------------------------------------------------
     AUTH
     --------------------------------------------------------------- */
  var CURRENT_USER_KEY = 'ssph_current_user';   // same key gate.js / app.js already read

  /* Mirror the signed-in profile into localStorage so gate.js and renderHeader()
     keep working unchanged. This is only a UI convenience - never security. */
  function mirrorUser(profile) {
    try {
      if (!profile) { localStorage.removeItem(CURRENT_USER_KEY); return; }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
        fullName: profile.full_name,
        email: profile.provider === 'instagram' ? '' : (profile.email || ''),
        username: profile.provider === 'instagram' ? profile.provider_id : '',
        phone: profile.phone || '',
        address: profile.address || '',
        provider: profile.provider,
        role: profile.role
      }));
    } catch (e) { /* storage blocked: ignore */ }
  }

  async function getProfile() {
    var s = await sb.auth.getSession();
    if (!s.data.session) return fail('Not signed in.');
    var r = await sb.from('profiles').select('*').eq('id', s.data.session.user.id).single();
    if (r.error) return fail(r.error);
    mirrorUser(r.data);
    return ok(r.data);
  }

  async function updateProfile(profile) {
    var s = await sb.auth.getSession();
    if (!s.data.session) return fail('Not signed in.');
    var r = await sb.from('profiles').update({
      full_name: String(profile.fullName || '').trim(),
      phone: String(profile.phone || '').trim(),
      address: String(profile.address || '').trim()
    }).eq('id', s.data.session.user.id).select('*').single();
    if (r.error) return fail(r.error);
    mirrorUser(r.data);
    return ok(r.data);
  }

  /* provider: 'email' | 'facebook' | 'instagram'. mode of the old socialAuth() is split in two:
     signUp() = "Sign Up" (creates the account once), signIn() = "Log In". */
  async function signUp(provider, rawId, password, extra) {
    extra = extra || {};
    var n = normalizeIdentifier(provider, rawId);            // from app.js (same format rules as the DB)
    if (!n.ok) return n;
    if (String(password || '').length < 6) return fail('Password must be at least 6 characters.');

    var res = await sb.auth.signUp({
      email: authEmailFor(provider, n.id),
      password: password,
      options: { data: {
        provider: provider,
        provider_id: n.id,
        full_name: extra.fullName || (provider === 'instagram' ? n.id : n.id.split('@')[0]),
        phone: extra.phone || '',
        address: extra.address || ''
      } }
    });
    if (res.error) {
      if (/already registered|already exists/i.test(res.error.message)) {
        return { ok: false, exists: true, error: 'This account is already registered. Please Log In instead.' };
      }
      return fail(res.error);
    }
    if (!res.data.session) {
      return fail('Sign-up worked but email confirmation is turned on. In Supabase go to Authentication -> Providers -> Email and turn OFF "Confirm email".');
    }
    return getProfile();
  }

  async function signIn(provider, rawId, password) {
    var n = normalizeIdentifier(provider, rawId);
    if (!n.ok) return n;
    var res = await sb.auth.signInWithPassword({ email: authEmailFor(provider, n.id), password: password });
    if (res.error) {
      // Supabase deliberately does not say whether the account exists or the password was wrong.
      return fail(/invalid login/i.test(res.error.message)
        ? 'Incorrect account or password. If you have not registered yet, please Sign Up first.'
        : res.error);
    }
    return getProfile();
  }

  async function signOut() {
    mirrorUser(null);
    var r = await sb.auth.signOut();
    return r.error ? fail(r.error) : ok(true);
  }

  /* Call at the top of every protected page. Sends the visitor to login.html when
     there is no valid Supabase session (also clears a stale localStorage mirror). */
  async function requireSession(redirectTo) {
    var s = await sb.auth.getSession();
    if (!s.data.session) {
      mirrorUser(null);
      location.replace(redirectTo || 'login.html');
      return false;
    }
    return true;
  }

  sb.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') mirrorUser(null);
  });

  /* ---------------------------------------------------------------
     CATALOG   (replaces data.js CATEGORIES / PRODUCTS)
     --------------------------------------------------------------- */
  function mapProduct(r) {
    return {
      id: r.product_id, categoryId: r.category_id, gender: r.gender,
      name: r.product_name, description: r.description || '',
      price: Number(r.price), colors: r.colors || [], stock: r.stock,
      image: r.image && (r.image.indexOf('product-images/') === 0 || /^https?:\/\//i.test(r.image))
        ? productImageUrl(r.image) : r.image,
      colorImages: Object.keys(r.color_images || {}).reduce(function (images, color) {
        images[color] = productImageUrl(r.color_images[color]);
        return images;
      }, {}),
      fit: r.image_fit === 'contain' ? 'contain' : undefined,
      featured: r.is_featured, isNew: r.is_new
    };
  }
  function productImageUrl(image) {
    if (!image) return '';
    if (/^https?:\/\//i.test(image)) return image;
    if (image.indexOf('product-images/') === 0) {
      return sb.storage.from('product-images').getPublicUrl(image.slice('product-images/'.length)).data.publicUrl;
    }
    return 'assets/img/' + image.replace(/^\/+/, '');
  }
  function mapCategory(r) { return { id: r.category_id, name: r.category_name, slug: r.slug }; }

  /* Fills the existing CATEGORIES / PRODUCTS arrays IN PLACE, so every render function
     in app.js and every page keeps working. Call once, then render:
         SSPH_DB.loadCatalog().then(function () { renderProductGrid('grid', PRODUCTS); }); */
  async function loadCatalog() {
    var c = await sb.from('categories').select('*').order('category_id');
    if (c.error) return fail(c.error);
    var p = await sb.from('products').select('*').order('product_id');
    if (p.error) return fail(p.error);
    var cats = c.data.map(mapCategory), prods = p.data.map(mapProduct);
    if (typeof CATEGORIES !== 'undefined') { CATEGORIES.length = 0; Array.prototype.push.apply(CATEGORIES, cats); }
    if (typeof PRODUCTS   !== 'undefined') { PRODUCTS.length = 0;   Array.prototype.push.apply(PRODUCTS, prods); }
    return ok({ categories: cats, products: prods });
  }
  async function watchCatalog(onChange, onStatus) {
    var session = await sb.auth.getSession();
    if (session.error) return fail(session.error);
    if (!session.data.session) return fail('Not signed in.');
    var channel = sb.channel('catalog-' + session.data.session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, onChange)
      .subscribe(onStatus);
    return ok(channel);
  }

  /* ---------------------------------------------------------------
     CART   (replaces localStorage cart; one row per user+product+colour)
     --------------------------------------------------------------- */
  async function cartList() {
    var r = await sb.from('cart')
      .select('cart_id, product_id, color, quantity, added_at')
      .order('added_at', { ascending: false });
    return r.error ? fail(r.error) : ok(r.data.map(function (x) {
      return { cartId: x.cart_id, productId: x.product_id, color: x.color, qty: x.quantity };
    }));
  }
  async function cartCount() {
    var l = await cartList();
    return l.ok ? l.data.reduce(function (s, i) { return s + i.qty; }, 0) : 0;
  }
  async function cartAdd(productId, color, qty) {
    var s = await sb.auth.getSession();
    if (!s.data.session) return fail('Please sign in first.');
    var uid = s.data.session.user.id;
    color = color || '';
    qty = Math.max(1, Number(qty) || 1);
    // same product + colour already in the cart -> add to that row (the DB caps it at stock)
    var ex = await sb.from('cart').select('cart_id, quantity')
      .eq('product_id', productId).eq('color', color).maybeSingle();
    if (ex.error) return fail(ex.error);
    var r = ex.data
      ? await sb.from('cart').update({ quantity: ex.data.quantity + qty }).eq('cart_id', ex.data.cart_id)
      : await sb.from('cart').insert({ user_id: uid, product_id: productId, color: color, quantity: qty });
    return r.error ? fail(r.error) : ok(true);
  }
  async function cartUpdate(cartId, qty) {
    var r = await sb.from('cart').update({ quantity: Math.max(1, Number(qty) || 1) }).eq('cart_id', cartId);
    return r.error ? fail(r.error) : ok(true);
  }
  async function cartRemove(cartId) {
    var r = await sb.from('cart').delete().eq('cart_id', cartId);
    return r.error ? fail(r.error) : ok(true);
  }

  /* ---------------------------------------------------------------
     CHECKOUT / ORDERS
     --------------------------------------------------------------- */
  var PAYMENT_METHODS = ['COD', 'GCash', 'Credit/Debit Card', 'Bank Transfer'];

  /* Calls the place_order() database function: creates the order, snapshots the items at
     the DB's prices, deducts stock and empties the cart in ONE transaction. Returns the order id. */
  async function placeOrder(o) {
    var method = PAYMENT_METHODS.indexOf(o.paymentMethod) >= 0 ? o.paymentMethod : 'COD';
    var r = await sb.rpc('place_order', {
      p_full_name: o.fullName, p_email: o.email, p_phone: o.phone,
      p_address: o.address, p_payment_method: method
    });
    return r.error ? fail(r.error) : ok(r.data);
  }
  async function myOrders() {
    var r = await sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    return r.error ? fail(r.error) : ok(r.data);
  }
  async function cancelMyOrder(orderId) {
    orderId = Number(orderId);
    if (!Number.isSafeInteger(orderId) || orderId < 1) return fail('Invalid order ID.');
    var r = await sb.from('orders')
      .update({ order_status: 'Cancelled' })
      .eq('order_id', orderId)
      .eq('order_status', 'Pending')
      .select('order_id')
      .maybeSingle();
    if (r.error) return fail(r.error);
    return r.data ? ok(true) : fail('This order could not be cancelled. It may no longer be pending, or customer cancellation has not been enabled yet.');
  }
  async function getOrder(orderId) {
    var r = await sb.from('orders').select('*, order_items(*)').eq('order_id', orderId).maybeSingle();
    if (r.error) return fail(r.error);
    return r.data ? ok(r.data) : fail('Order not found.');
  }
  async function watchOrders(isOwner, onChange, onStatus) {
    var session = await sb.auth.getSession();
    if (session.error) return fail(session.error);
    if (!session.data.session) return fail('Not signed in.');
    var userId = session.data.session.user.id;
    var filter = { event: '*', schema: 'public', table: 'orders' };
    if (!isOwner) filter.filter = 'user_id=eq.' + userId;
    var channel = sb.channel('orders-' + (isOwner ? 'owner-' : 'customer-') + userId)
      .on('postgres_changes', filter, onChange)
      .subscribe(onStatus);
    return ok(channel);
  }

  /* ---------------------------------------------------------------
     ADMIN  (the database refuses all of these unless profiles.role = 'admin')
     --------------------------------------------------------------- */
  var ORDER_STATUSES = ['Pending', 'Preparing', 'Packaging', 'Ready for pickup', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

  async function adminStats() {
    var r = await sb.rpc('admin_dashboard_stats');
    return r.error ? fail(r.error) : ok(r.data);
  }
  async function adminListOrders(limit) {
    var q = sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (limit) q = q.limit(limit);
    var r = await q;
    return r.error ? fail(r.error) : ok(r.data);
  }
  async function adminSetOrderStatus(orderId, status) {
    if (ORDER_STATUSES.indexOf(status) < 0) return fail('Invalid order status.');
    var r = await sb.from('orders').update({ order_status: status }).eq('order_id', orderId);
    return r.error ? fail(r.error) : ok(true);
  }
  async function adminDeleteOrder(orderId) {
    if (!Number.isSafeInteger(orderId) || orderId < 1) return fail('Invalid order ID.');
    var r = await sb.from('orders').delete().eq('order_id', orderId).select('order_id').maybeSingle();
    if (r.error) return fail(r.error);
    return r.data ? ok(true) : fail('Order not found or you do not have permission to delete it.');
  }
  async function adminGetPaymentQr() {
    var r = await sb.from('store_settings').select('value')
      .eq('setting_key', 'payment_qr_payload').maybeSingle();
    return r.error ? fail(r.error) : ok(r.data ? r.data.value : '');
  }
  async function adminSavePaymentQr(payload) {
    payload = String(payload || '').trim();
    if (payload.length > 1000) return fail('QR content must be 1,000 characters or fewer.');
    var r = await sb.from('store_settings').upsert({
      setting_key: 'payment_qr_payload',
      value: payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });
    return r.error ? fail(r.error) : ok(true);
  }
  async function adminListProducts() {
    var r = await sb.from('products').select('*, categories(category_name)').order('created_at', { ascending: false });
    return r.error ? fail(r.error) : ok(r.data);
  }
  async function adminListCategories() {
    var r = await sb.from('categories').select('category_id, category_name').order('category_name');
    return r.error ? fail(r.error) : ok(r.data);
  }
  /* p uses the same field names as the admin form / PRODUCTS shape. Pass p.id to update, omit to insert. */
  async function adminSaveProduct(p) {
    var price = Number(p.price), stock = Number(p.stock), categoryId = Number(p.categoryId);
    if (!String(p.name || '').trim()) return fail('Enter a product name.');
    if (!categoryId || !Number.isInteger(categoryId)) return fail('Choose a product category.');
    if (!Number.isFinite(price) || price < 0) return fail('Enter a valid product price.');
    if (!Number.isInteger(stock) || stock < 0) return fail('Stock must be a whole number of zero or more.');
    if (['Men', 'Women', 'Children'].indexOf(p.gender) < 0) return fail('Choose a valid product audience.');
    if (String(p.description || '').length > 5000) return fail('Description must be 5,000 characters or fewer.');
    var colors = Array.isArray(p.colors) ? p.colors
      : String(p.colors || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    colors = colors.map(function (color) { return String(color).trim(); }).filter(Boolean);
    if (new Set(colors.map(function (color) { return color.toLowerCase(); })).size !== colors.length) {
      return fail('Each product color must be unique.');
    }
    var row = {
      category_id: categoryId, gender: p.gender, product_name: String(p.name).trim(), description: String(p.description || '').trim() || null,
      price: price, colors: colors,
      stock: stock, image: p.image || null, image_fit: p.fit === 'contain' ? 'contain' : 'cover',
      is_featured: !!p.featured, is_new: !!p.isNew
    };
    var r = p.id
      ? await sb.from('products').update(row).eq('product_id', p.id).select('product_id').maybeSingle()
      : await sb.from('products').insert(row).select('product_id').single();
    if (r.error) return fail(r.error);
    return r.data ? ok(r.data) : fail('Product was not found or you do not have permission to change it.');
  }
  async function adminDeleteProduct(productId) {
    if (!Number.isSafeInteger(Number(productId)) || Number(productId) < 1) return fail('Invalid product ID.');
    var existing = await sb.from('products').select('image').eq('product_id', productId).maybeSingle();
    if (existing.error) return fail(existing.error);
    if (!existing.data) return fail('Product was not found or you do not have permission to delete it.');
    var r = await sb.from('products').delete().eq('product_id', productId).select('product_id').maybeSingle();
    if (r.error) return fail(r.error);
    if (!r.data) return fail('Product was not found or you do not have permission to delete it.');
    var images = [existing.data.image]
      .filter(function (image) { return image && image.indexOf('product-images/') === 0; })
      .map(function (image) { return image.slice('product-images/'.length); });
    if (images.length) {
      var removed = await sb.storage.from('product-images').remove(images);
      if (removed.error) return ok({ warning: 'Product deleted, but some stored images could not be removed: ' + removed.error.message });
    }
    return ok({ warning: '' });
  }
  async function adminUploadProductImage(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      return fail('Choose a JPG, PNG, or WebP image.');
    }
    if (file.size > 5 * 1024 * 1024) return fail('Product images must be 5 MB or smaller.');
    var extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    var id = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    var path = id + '.' + extension;
    var uploaded = await sb.storage.from('product-images').upload(path, file, {
      cacheControl: '3600', contentType: file.type, upsert: false
    });
    if (uploaded.error) return fail(uploaded.error);
    return ok('product-images/' + path);
  }
  async function adminRemoveProductImage(image) {
    if (!image || image.indexOf('product-images/') !== 0) return ok(true);
    var removed = await sb.storage.from('product-images').remove([image.slice('product-images/'.length)]);
    return removed.error ? fail(removed.error) : ok(true);
  }
  function reviewError(error) {
    var message = error && error.message ? error.message : String(error || 'Unknown error.');
    if (/PGRST205|could not find the table ['"]?public\.product_reviews['"]? in the schema cache|relation ['"]?public\.product_reviews['"]? does not exist/i.test(message)) {
      return fail('Customer reviews are not set up in Supabase yet. Run supabase/10_inventory_reviews.sql in the SQL Editor, then reload this page.');
    }
    if (/reviewer_name/i.test(message) && /PGRST204|schema cache|does not exist|not found/i.test(message)) {
      return fail('Review names are not set up in Supabase yet. Run supabase/11_customer_order_cancellation_review_names.sql, then reload this page.');
    }
    return fail(error);
  }
  async function listProductReviews(productId) {
    var r = await sb.from('product_reviews')
      .select('review_id, product_id, user_id, reviewer_name, rating, comment, created_at')
      .eq('product_id', productId).order('created_at', { ascending: false }).limit(50);
    return r.error ? reviewError(r.error) : ok(r.data);
  }
  async function getMyProductReview(productId) {
    var s = await sb.auth.getSession();
    if (s.error) return fail(s.error);
    if (!s.data.session) return fail('Please sign in to leave a review.');
    var r = await sb.from('product_reviews').select('rating, comment')
      .eq('product_id', productId).eq('user_id', s.data.session.user.id).maybeSingle();
    return r.error ? reviewError(r.error) : ok(r.data);
  }
  async function submitProductReview(productId, rating, comment) {
    var s = await sb.auth.getSession();
    if (s.error) return fail(s.error);
    if (!s.data.session) return fail('Please sign in to leave a review.');
    rating = Number(rating);
    comment = String(comment || '').trim();
    if (!Number.isSafeInteger(Number(productId)) || Number(productId) < 1) return fail('Invalid product.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Choose a rating from 1 to 5 stars.');
    if (!comment || comment.length > 2000) return fail('Write a comment of 1 to 2,000 characters.');
    var r = await sb.from('product_reviews').upsert({
      product_id: Number(productId),
      user_id: s.data.session.user.id,
      rating: rating,
      comment: comment
    }, { onConflict: 'product_id,user_id' }).select('review_id').single();
    return r.error ? reviewError(r.error) : ok(r.data);
  }
  async function adminListProductReviews(limit) {
    var q = sb.from('product_reviews')
      .select('review_id, reviewer_name, rating, comment, created_at, profiles!product_reviews_user_id_fkey(full_name, email), products!product_reviews_product_id_fkey(product_name)')
      .order('created_at', { ascending: false });
    if (limit) q = q.limit(limit);
    var r = await q;
    return r.error ? reviewError(r.error) : ok(r.data);
  }
  async function watchProductReviews(productId, onChange, onStatus) {
    var session = await sb.auth.getSession();
    if (session.error) return fail(session.error);
    if (!session.data.session) return fail('Not signed in.');
    var channel = sb.channel('reviews-product-' + productId + '-' + session.data.session.user.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'product_reviews', filter: 'product_id=eq.' + Number(productId)
      }, onChange)
      .subscribe(onStatus);
    return ok(channel);
  }
  async function watchProductReviewsAdmin(onChange, onStatus) {
    var session = await sb.auth.getSession();
    if (session.error) return fail(session.error);
    if (!session.data.session) return fail('Not signed in.');
    var channel = sb.channel('reviews-admin-' + session.data.session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_reviews' }, onChange)
      .subscribe(onStatus);
    return ok(channel);
  }

  window.SSPH_DB = {
    client: sb, authEmailFor: authEmailFor,
    signUp: signUp, signIn: signIn, signOut: signOut, getProfile: getProfile, updateProfile: updateProfile, requireSession: requireSession,
    loadCatalog: loadCatalog, watchCatalog: watchCatalog,
    cartList: cartList, cartCount: cartCount, cartAdd: cartAdd, cartUpdate: cartUpdate, cartRemove: cartRemove,
    placeOrder: placeOrder, myOrders: myOrders, cancelMyOrder: cancelMyOrder, getOrder: getOrder, watchOrders: watchOrders,
    adminStats: adminStats, adminListOrders: adminListOrders, adminSetOrderStatus: adminSetOrderStatus, adminDeleteOrder: adminDeleteOrder,
    adminGetPaymentQr: adminGetPaymentQr, adminSavePaymentQr: adminSavePaymentQr,
    adminListProducts: adminListProducts, adminListCategories: adminListCategories,
    adminSaveProduct: adminSaveProduct, adminDeleteProduct: adminDeleteProduct,
    adminUploadProductImage: adminUploadProductImage, adminRemoveProductImage: adminRemoveProductImage,
    productImageUrl: productImageUrl, listProductReviews: listProductReviews, getMyProductReview: getMyProductReview,
    submitProductReview: submitProductReview, adminListProductReviews: adminListProductReviews,
    watchProductReviews: watchProductReviews, watchProductReviewsAdmin: watchProductReviewsAdmin,
    PAYMENT_METHODS: PAYMENT_METHODS, ORDER_STATUSES: ORDER_STATUSES
  };
})();
