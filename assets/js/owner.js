/* Owner dashboard behavior. Database access is restricted by Supabase RLS. */
(function () {
  'use strict';

  var notice = document.getElementById('owner-notice');

  function showNotice(message, isError) {
    notice.textContent = message || '';
    notice.className = 'owner-notice' + (isError ? ' error' : '');
  }

  function setPanel(name) {
    document.querySelectorAll('.owner-tab').forEach(function (button) {
      button.classList.toggle('active', button.dataset.panel === name);
    });
    document.querySelectorAll('.owner-panel').forEach(function (panel) {
      panel.hidden = panel.id !== 'panel-' + name;
    });
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
          '<small>' + escapeHtml(order.phone) + '</small><small>' + escapeHtml(order.address) + '</small></td>' +
        '<td>' + escapeHtml(order.payment_method) + '</td>' +
        '<td><strong>' + formatPrice(order.total_amount) + '</strong></td>' +
        '<td><div class="owner-status-editor"><select class="order-status" data-order-id="' + Number(order.order_id) + '">' + options + '</select>' +
          '<button type="button" class="btn btn-small save-status" data-order-id="' + Number(order.order_id) + '">Save</button></div>' +
          '<span class="status-feedback" data-feedback-id="' + Number(order.order_id) + '"></span></td>' +
        '</tr>';
    }).join('');
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
      showNotice('This page is available to the store owner only.', true);
      document.querySelector('.owner-tabs').hidden = true;
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
    await refreshDashboard(false);
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
  }

  document.querySelectorAll('.owner-tab').forEach(function (button) {
    button.addEventListener('click', function () { setPanel(button.dataset.panel); });
  });
  document.querySelectorAll('[data-open-panel]').forEach(function (button) {
    button.addEventListener('click', function () { setPanel(button.dataset.openPanel); });
  });
  document.getElementById('refresh-dashboard').addEventListener('click', function () {
    refreshDashboard(true);
  });

  document.getElementById('all-orders').addEventListener('click', async function (event) {
    var button = event.target.closest('.save-status');
    if (!button) return;
    var orderId = Number(button.dataset.orderId);
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
    if (!document.hidden) refreshDashboard(false);
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshDashboard(false);
  });
})();
