/* Owner dashboard behavior. Database access is restricted by Supabase RLS. */
(function () {
  'use strict';

  var notice = document.getElementById('owner-notice');

  function showNotice(message, isError) {
    notice.textContent = message || '';
    notice.className = 'owner-notice' + (isError ? ' error' : '');
  }

  function setPanel(name) {
    var validPanel = Array.prototype.some.call(document.querySelectorAll('.owner-tab'), function (button) {
      return button.dataset.panel === name;
    });
    if (!validPanel) name = 'overview';
    document.querySelectorAll('.owner-tab').forEach(function (button) {
      button.classList.toggle('active', button.dataset.panel === name);
    });
    document.querySelectorAll('.owner-panel').forEach(function (panel) {
      panel.hidden = panel.id !== 'panel-' + name;
    });
    if (window.location.hash !== '#' + name) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#' + name);
    }
  }

  function dateLabel(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  function statusClass(status) {
    return 'status-' + String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function renderRecentOrders(orders) {
    var rows = orders.slice(0, 6);
    document.getElementById('recent-empty').hidden = rows.length > 0;
    document.getElementById('recent-orders').innerHTML = rows.map(function (order) {
      return '<tr><td>#' + escapeHtml(String(order.order_id).padStart(6, '0')) + '</td>' +
        '<td>' + escapeHtml(order.full_name) + '</td>' +
        '<td>' + escapeHtml(dateLabel(order.created_at)) + '</td>' +
        '<td>' + formatPrice(order.total_amount) + '</td>' +
        '<td><span class="owner-status ' + statusClass(order.order_status) + '">' + escapeHtml(order.order_status) + '</span></td></tr>';
    }).join('');
  }

  function renderAllOrders(orders) {
    var body = document.getElementById('all-orders');
    document.getElementById('orders-empty').hidden = orders.length > 0;
    body.innerHTML = orders.map(function (order) {
      var items = (order.order_items || []).map(function (item) {
        return escapeHtml(item.product_name) + ' × ' + Number(item.quantity) +
          (item.color ? ' (' + escapeHtml(item.color) + ')' : '');
      }).join('<br>');
      var options = SSPH_DB.ORDER_STATUSES.map(function (status) {
        return '<option value="' + escapeHtml(status) + '"' +
          (status === order.order_status ? ' selected' : '') + '>' + escapeHtml(status) + '</option>';
      }).join('');
      return '<tr>' +
        '<td><strong>#' + escapeHtml(String(order.order_id).padStart(6, '0')) + '</strong><small>' +
          escapeHtml(dateLabel(order.created_at)) + '</small><div class="owner-order-items">' + (items || 'Order details unavailable') + '</div></td>' +
        '<td><strong>' + escapeHtml(order.full_name) + '</strong><small>' + escapeHtml(order.email) + '</small>' +
          '<small>' + escapeHtml(order.phone) + '</small><small>Delivery address: ' + escapeHtml(formatOrderAddress(order)) + '</small>' +
          (order.delivery_note ? '<small><strong>Delivery instructions:</strong> ' + escapeHtml(order.delivery_note) + '</small>' : '') + '</td>' +
        '<td>' + escapeHtml(order.payment_method) + '</td>' +
        '<td><strong>' + formatPrice(order.total_amount) + '</strong></td>' +
        '<td><div class="owner-status-editor"><select class="order-status" data-order-id="' + Number(order.order_id) + '">' + options + '</select>' +
          '<button type="button" class="btn btn-small save-status" data-order-id="' + Number(order.order_id) + '">Save</button>' +
          '<button type="button" class="btn btn-small delete-order" data-order-id="' + Number(order.order_id) +
            '" aria-label="Delete order #' + escapeHtml(String(order.order_id).padStart(6, '0')) +
            '" title="Permanently delete order">🗑 Delete</button></div>' +
          '<span class="status-feedback" data-feedback-id="' + Number(order.order_id) + '"></span></td>' +
        '</tr>';
    }).join('');
  }

  var inventoryProducts = [];
  var currentProductImage = '';
  var previewObjectUrl = '';

  function productColors() {
    return document.getElementById('product-colors').value.split(',')
      .map(function (color) { return color.trim(); })
      .filter(Boolean);
  }

  function renderInventory(products) {
    inventoryProducts = products;
    document.getElementById('inventory-empty').hidden = products.length > 0;
    document.getElementById('inventory-products').innerHTML = products.map(function (product) {
      var image = SSPH_DB.productImageUrl(product.image);
      var stock = Number(product.stock);
      var swatches = (product.colors || []).map(function (color) {
        var hex = productColorHex({}, color);
        return '<span class="color-swatch-preview" title="' + escapeHtml(color) +
          '" aria-label="' + escapeHtml(color) + '" style="background-color:' + hex + '"></span>';
      }).join('');
      return '<tr><td class="inventory-product-cell">' +
        (image ? '<img class="inventory-row-image" src="' + escapeHtml(image) + '" alt="">' : '') +
        '<span><strong>' + escapeHtml(product.product_name) + '</strong><small>' + escapeHtml(product.gender) + '</small>' +
          (swatches ? '<span class="inventory-color-swatches">' + swatches + '</span>' : '') + '</span></td>' +
        '<td>' + escapeHtml(product.categories && product.categories.category_name || '—') + '</td>' +
        '<td>' + formatPrice(product.price) + '</td>' +
        '<td><span class="inventory-stock ' + (stock > 0 ? 'in-stock' : 'out-of-stock') + '">' +
          (stock > 0 ? stock + ' in stock' : 'Out of stock') + '</span></td>' +
        '<td><div class="inventory-actions"><button type="button" class="btn btn-small edit-product" data-product-id="' +
          Number(product.product_id) + '">Edit</button><button type="button" class="btn btn-secondary btn-small delete-product" data-product-id="' +
          Number(product.product_id) + '">Delete</button></div></td></tr>';
    }).join('');
  }

  async function refreshInventory() {
    var results = await Promise.all([SSPH_DB.adminListProducts(), SSPH_DB.adminListCategories()]);
    var failed = results.find(function (result) { return !result.ok; });
    if (failed) {
      showNotice('Could not load inventory: ' + failed.error, true);
      return;
    }
    var categorySelect = document.getElementById('product-category');
    var selectedCategory = categorySelect.value;
    categorySelect.innerHTML = results[1].data.map(function (category) {
      return '<option value="' + Number(category.category_id) + '">' + escapeHtml(category.category_name) + '</option>';
    }).join('');
    if (selectedCategory) categorySelect.value = selectedCategory;
    renderInventory(results[0].data);
  }

  function renderFeedback(reviews) {
    document.getElementById('feedback-empty').hidden = reviews.length > 0;
    document.getElementById('customer-feedback').innerHTML = reviews.map(function (review) {
      var profile = review.profiles || {};
      var product = review.products || {};
      return '<tr><td><strong>' + escapeHtml(product.product_name || 'Deleted product') + '</strong></td>' +
        '<td><span class="review-stars" aria-label="' + Number(review.rating) + ' out of 5 stars">' +
          '★'.repeat(Number(review.rating)) + '☆'.repeat(5 - Number(review.rating)) +
          '</span><small>' + Number(review.rating) + '/5</small></td>' +
        '<td>' + escapeHtml(review.reviewer_name || profile.full_name || profile.email || 'Customer') +
          (profile.email ? '<small>' + escapeHtml(profile.email) + '</small>' : '') + '</td>' +
        '<td class="feedback-comment">' + escapeHtml(review.comment) + '</td>' +
        '<td>' + escapeHtml(dateLabel(review.created_at)) + '</td></tr>';
    }).join('');
  }

  async function refreshFeedback() {
    var result = await SSPH_DB.adminListProductReviews(200);
    if (!result.ok) {
      showNotice('Could not load customer feedback. Check supabase/10_inventory_reviews.sql and supabase/11_customer_order_cancellation_review_names.sql. Details: ' + result.error, true);
      return;
    }
    renderFeedback(result.data);
    if (result.reviewerNamesAvailable === false) {
      showNotice('Customer reviews are visible, but reviewer names are not set up yet. Run supabase/11_customer_order_cancellation_review_names.sql.');
    }
  }

  function resetProductForm() {
    var form = document.getElementById('product-form');
    form.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-stock').value = '0';
    document.getElementById('product-form-title').textContent = 'Add a bag product';
    document.getElementById('save-product').textContent = 'Add product';
    document.getElementById('cancel-product-edit').hidden = true;
    currentProductImage = '';
    var preview = document.getElementById('product-image-preview');
    preview.hidden = true;
    preview.removeAttribute('src');
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
  }

  function beginProductEdit(product) {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
    document.getElementById('product-id').value = product.product_id;
    document.getElementById('product-name').value = product.product_name || '';
    document.getElementById('product-category').value = product.category_id;
    document.getElementById('product-gender').value = product.gender;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-colors').value = (product.colors || []).join(', ');
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-featured').checked = !!product.is_featured;
    document.getElementById('product-new').checked = !!product.is_new;
    document.getElementById('product-image').value = '';
    currentProductImage = product.image || '';
    var preview = document.getElementById('product-image-preview');
    var imageUrl = SSPH_DB.productImageUrl(currentProductImage);
    preview.hidden = !imageUrl;
    if (imageUrl) preview.src = imageUrl;
    document.getElementById('product-form-title').textContent = 'Edit product';
    document.getElementById('save-product').textContent = 'Save changes';
    document.getElementById('cancel-product-edit').hidden = false;
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function refreshDashboard(showLoading) {
    if (showLoading) showNotice('Refreshing dashboard…');
    var results = await Promise.all([SSPH_DB.adminStats(), SSPH_DB.adminListOrders(100)]);
    var failed = results.find(function (result) { return !result.ok; });
    if (failed) {
      showNotice('Could not load dashboard data: ' + failed.error, true);
      return;
    }

    var stats = results[0].data;
    var orders = results[1].data;
    document.getElementById('metric-revenue').textContent = formatPrice(stats.total_revenue);
    document.getElementById('metric-orders').textContent = Number(stats.total_orders).toLocaleString();
    document.getElementById('metric-customers').textContent = Number(stats.total_customers).toLocaleString();
    document.getElementById('metric-products').textContent = Number(stats.total_products).toLocaleString();
    renderRecentOrders(orders);
    renderAllOrders(orders);
    showNotice('Updated ' + new Date().toLocaleTimeString());
  }

  var refreshTimer;
  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(function () {
      if (!document.hidden) refreshDashboard(false);
    }, 150);
  }

  function renderQr(payload) {
    var preview = document.getElementById('qr-preview');
    var download = document.getElementById('download-qr');
    preview.replaceChildren();
    download.disabled = true;
    if (!payload) {
      var empty = document.createElement('p');
      empty.textContent = 'Enter payment details and save to generate your QR code.';
      preview.appendChild(empty);
      return;
    }
    if (typeof QRCode === 'undefined') {
      var error = document.createElement('p');
      error.textContent = 'The QR generator could not load. Check your internet connection and reload.';
      preview.appendChild(error);
      return;
    }
    new QRCode(preview, { text: payload, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
    download.disabled = false;
  }

  async function loadOwner() {
    if (!(await SSPH_DB.requireSession('login.html?redirect=owner.html'))) return;
    var profile = await SSPH_DB.getProfile();
    if (!profile.ok) {
      showNotice('Could not load owner profile: ' + profile.error, true);
      return;
    }
    renderHeader();
    if (profile.data.role !== 'admin') {
      showNotice(
        'This account (' + (profile.data.email || 'signed-in email') + ') has the "' +
        profile.data.role + '" role. Set its role to "admin" in public.profiles to enable the owner dashboard.',
        true
      );
      document.querySelector('.owner-tabs').hidden = true;
      document.querySelectorAll('.owner-panel').forEach(function (panel) {
        panel.hidden = true;
      });
      return;
    }

    document.getElementById('profile-name').value = profile.data.full_name || '';
    document.getElementById('profile-email').value = profile.data.email || '';
    document.getElementById('profile-phone').value = profile.data.phone || '';
    document.getElementById('profile-address').value = profile.data.address || '';
    var qr = await SSPH_DB.adminGetPaymentQr();
    if (!qr.ok) {
      document.getElementById('qr-preview').textContent =
        'Could not load the payment QR setting. Run supabase/04_owner_dashboard.sql. Details: ' + qr.error;
    } else {
      document.getElementById('qr-payload').value = qr.data;
      renderQr(qr.data);
    }
    await Promise.all([refreshDashboard(false), refreshInventory(), refreshFeedback()]);
    if (!qr.ok) showNotice('Could not load the payment QR setting. Run supabase/04_owner_dashboard.sql.', true);
    var subscription = await SSPH_DB.watchOrders(true, scheduleRefresh, function (status, error) {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        showNotice('Live order updates disconnected. Reconnecting…' + (error ? ' ' + error : ''), true);
      } else if (status === 'SUBSCRIBED') {
        showNotice('Live order updates connected.');
        scheduleRefresh();
      }
    });
    if (!subscription.ok) showNotice('Live order updates unavailable: ' + subscription.error, true);
    var reviewSubscription = await SSPH_DB.watchProductReviewsAdmin(refreshFeedback, function (status, error) {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        showNotice('Live customer feedback updates disconnected. ' + (error || ''), true);
      }
    });
    if (!reviewSubscription.ok) showNotice('Live customer feedback updates unavailable: ' + reviewSubscription.error, true);
    var catalogSubscription = await SSPH_DB.watchCatalog(function () {
      Promise.all([refreshInventory(), refreshDashboard(false)]);
    }, function (status, error) {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        showNotice('Live inventory updates disconnected. ' + (error || ''), true);
      }
    });
    if (!catalogSubscription.ok) showNotice('Live inventory updates unavailable: ' + catalogSubscription.error, true);
  }

  document.querySelectorAll('.owner-tab').forEach(function (button) {
    button.addEventListener('click', function () { setPanel(button.dataset.panel); });
  });
  setPanel(window.location.hash.slice(1) || 'overview');
  document.querySelectorAll('[data-open-panel]').forEach(function (button) {
    button.addEventListener('click', function () { setPanel(button.dataset.openPanel); });
  });
  document.getElementById('refresh-dashboard').addEventListener('click', function () {
    showNotice('Refreshing dashboard…');
    Promise.all([refreshDashboard(false), refreshInventory(), refreshFeedback()]);
  });

  document.getElementById('product-image').addEventListener('change', function () {
    var file = this.files && this.files[0];
    var preview = document.getElementById('product-image-preview');
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
    if (!file) {
      var existingUrl = SSPH_DB.productImageUrl(currentProductImage);
      preview.hidden = !existingUrl;
      if (existingUrl) preview.src = existingUrl;
      else preview.removeAttribute('src');
      return;
    }
    previewObjectUrl = URL.createObjectURL(file);
    preview.src = previewObjectUrl;
    preview.hidden = false;
  });

  document.getElementById('cancel-product-edit').addEventListener('click', resetProductForm);
  document.getElementById('inventory-products').addEventListener('click', async function (event) {
    var editButton = event.target.closest('.edit-product');
    var deleteButton = event.target.closest('.delete-product');
    if (editButton) {
      var selected = inventoryProducts.find(function (product) {
        return product.product_id === Number(editButton.dataset.productId);
      });
      if (selected) beginProductEdit(selected);
      return;
    }
    if (!deleteButton) return;
    var product = inventoryProducts.find(function (item) {
      return item.product_id === Number(deleteButton.dataset.productId);
    });
    if (!product || !window.confirm('Delete "' + product.product_name + '" from the store? This cannot be undone.')) return;
    deleteButton.disabled = true;
    var result = await SSPH_DB.adminDeleteProduct(product.product_id);
    if (!result.ok) {
      showNotice('Could not delete product: ' + result.error, true);
    } else {
      showNotice(result.data.warning || 'Product deleted from the store.', !!result.data.warning);
      await Promise.all([refreshInventory(), refreshDashboard(false)]);
    }
    deleteButton.disabled = false;
  });

  document.getElementById('product-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    var submit = document.getElementById('save-product');
    var productId = Number(document.getElementById('product-id').value) || null;
    var file = document.getElementById('product-image').files[0];
    var imagePath = currentProductImage;
    var colors = productColors();
    var newlyUploadedImage = '';
    submit.disabled = true;
    showNotice(file ? 'Uploading product picture…' : 'Saving product…');
    if (file) {
      var upload = await SSPH_DB.adminUploadProductImage(file);
      if (!upload.ok) {
        submit.disabled = false;
        showNotice('Could not upload product picture: ' + upload.error, true);
        return;
      }
      imagePath = upload.data;
      newlyUploadedImage = upload.data;
    }
    var result = await SSPH_DB.adminSaveProduct({
      id: productId,
      categoryId: document.getElementById('product-category').value,
      gender: document.getElementById('product-gender').value,
      name: document.getElementById('product-name').value,
      description: document.getElementById('product-description').value,
      price: document.getElementById('product-price').value,
      stock: document.getElementById('product-stock').value,
      colors: colors,
      image: imagePath,
      featured: document.getElementById('product-featured').checked,
      isNew: document.getElementById('product-new').checked
    });
    if (!result.ok) {
      var uploadCleanupWarnings = [];
      if (newlyUploadedImage) {
        var uploadCleanup = await SSPH_DB.adminRemoveProductImage(newlyUploadedImage);
        if (!uploadCleanup.ok) uploadCleanupWarnings.push(uploadCleanup.error);
      }
      submit.disabled = false;
      showNotice('Could not save product: ' + result.error +
        (uploadCleanupWarnings.length ? ' Unused uploads could not be removed: ' + uploadCleanupWarnings.join('; ') : ''), true);
      return;
    }
    var cleanupWarnings = [];
    if (newlyUploadedImage && currentProductImage && currentProductImage !== newlyUploadedImage) {
      var removedOldMainImage = await SSPH_DB.adminRemoveProductImage(currentProductImage);
      if (!removedOldMainImage.ok) cleanupWarnings.push(removedOldMainImage.error);
    }
    resetProductForm();
    submit.disabled = false;
    await Promise.all([refreshInventory(), refreshDashboard(false)]);
    showNotice((productId ? 'Product updated.' : 'Product added to the shop.') +
      (cleanupWarnings.length ? ' Some replaced images could not be removed: ' + cleanupWarnings.join('; ') : ''),
      cleanupWarnings.length > 0);
  });

  document.getElementById('all-orders').addEventListener('click', async function (event) {
    var button = event.target.closest('.save-status, .delete-order');
    if (!button) return;
    var orderId = Number(button.dataset.orderId);
    if (button.classList.contains('delete-order')) {
      var orderLabel = '#' + String(orderId).padStart(6, '0');
      if (!window.confirm(
        'Permanently delete order ' + orderLabel + ' and its order items? This cannot be undone. Inventory will not be restored.'
      )) return;

      var deleteFeedback = document.querySelector('[data-feedback-id="' + orderId + '"]');
      button.disabled = true;
      deleteFeedback.textContent = 'Deleting…';
      deleteFeedback.className = 'status-feedback';
      var deleteResult = await SSPH_DB.adminDeleteOrder(orderId);
      if (!deleteResult.ok) {
        button.disabled = false;
        deleteFeedback.textContent = deleteResult.error;
        deleteFeedback.className = 'status-feedback error';
        return;
      }
      showNotice('Order ' + orderLabel + ' deleted.');
      await refreshDashboard(false);
      return;
    }

    var select = document.querySelector('.order-status[data-order-id="' + orderId + '"]');
    var feedback = document.querySelector('[data-feedback-id="' + orderId + '"]');
    button.disabled = true;
    feedback.textContent = 'Saving…';
    var result = await SSPH_DB.adminSetOrderStatus(orderId, select.value);
    button.disabled = false;
    if (!result.ok) {
      feedback.textContent = result.error;
      feedback.className = 'status-feedback error';
      return;
    }
    feedback.textContent = 'Saved';
    feedback.className = 'status-feedback success';
    await refreshDashboard(false);
  });

  document.getElementById('profile-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    var button = this.querySelector('button[type="submit"]');
    button.disabled = true;
    var result = await SSPH_DB.updateProfile({
      fullName: document.getElementById('profile-name').value,
      phone: document.getElementById('profile-phone').value,
      address: document.getElementById('profile-address').value
    });
    button.disabled = false;
    if (!result.ok) {
      showNotice('Could not save profile: ' + result.error, true);
      return;
    }
    renderHeader();
    showNotice('Owner profile saved.');
  });

  document.getElementById('qr-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    var button = this.querySelector('button[type="submit"]');
    var payload = document.getElementById('qr-payload').value.trim();
    button.disabled = true;
    var result = await SSPH_DB.adminSavePaymentQr(payload);
    button.disabled = false;
    if (!result.ok) {
      showNotice('Could not save payment QR: ' + result.error, true);
      return;
    }
    renderQr(payload);
    showNotice(payload ? 'Payment QR saved.' : 'Payment QR removed.');
  });

  document.getElementById('download-qr').addEventListener('click', function () {
    var preview = document.getElementById('qr-preview');
    var canvas = preview.querySelector('canvas');
    var image = preview.querySelector('img');
    var url = canvas ? canvas.toDataURL('image/png') : (image ? image.src : '');
    if (!url) {
      showNotice('QR image is not ready to download.', true);
      return;
    }
    var link = document.createElement('a');
    link.href = url;
    link.download = 'swift-style-payment-qr.png';
    link.click();
  });

  loadOwner();
  window.setInterval(function () {
    if (!document.hidden) Promise.all([refreshDashboard(false), refreshInventory(), refreshFeedback()]);
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) Promise.all([refreshDashboard(false), refreshInventory(), refreshFeedback()]);
  });
})();
