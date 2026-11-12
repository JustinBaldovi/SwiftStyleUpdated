/* Customer order history with user-scoped Supabase Realtime updates. */
(function () {
  'use strict';

  var list = document.getElementById('customer-orders-list');
  var notice = document.getElementById('orders-notice');
  var liveStatus = document.getElementById('orders-live-status');
  var refreshTimer;

  function statusClass(status) {
    return 'status-' + String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function showError(message) {
    notice.textContent = message;
    notice.className = 'owner-notice error';
  }

  function renderOrders(orders) {
    if (!orders.length) {
      list.innerHTML = '<div class="customer-order-empty"><h2>No orders yet</h2><p>Your completed purchases will show up here.</p><a class="btn" href="shop.html">Browse the shop</a></div>';
      return;
    }

    list.innerHTML = orders.map(function (order) {
      var items = (order.order_items || []).map(function (item) {
        return '<li><span>' + escapeHtml(item.product_name) +
          (item.color ? ' (' + escapeHtml(item.color) + ')' : '') + ' × ' + Number(item.quantity) +
          '</span><strong>' + formatPrice(item.subtotal) + '</strong></li>';
      }).join('');
      var date = new Date(order.created_at);
      return '<article class="customer-order-card">' +
        '<header><div><p class="customer-order-number">Order #' + escapeHtml(String(order.order_id).padStart(6, '0')) +
          '</p><time datetime="' + escapeHtml(order.created_at) + '">' +
          escapeHtml(isNaN(date.getTime()) ? '' : date.toLocaleString()) + '</time></div>' +
          '<span class="owner-status ' + statusClass(order.order_status) + '">' + escapeHtml(order.order_status) + '</span></header>' +
        '<ul class="customer-order-items">' + items + '</ul>' +
        '<div class="customer-order-meta"><span>' + escapeHtml(order.payment_method) +
          ' · ' + escapeHtml(formatOrderAddress(order)) +
          (order.delivery_note ? ' · Instructions: ' + escapeHtml(order.delivery_note) : '') +
          '</span><strong>Total ' + formatPrice(order.total_amount) + '</strong></div>' +
        (order.order_status === 'Pending'
          ? '<div class="customer-order-actions"><button type="button" class="customer-order-cancel" data-order-id="' +
            Number(order.order_id) + '">Cancel order</button></div>'
          : '') +
        '</article>';
    }).join('');

    list.querySelectorAll('.customer-order-cancel').forEach(function (button) {
      button.addEventListener('click', async function () {
        var orderId = Number(button.dataset.orderId);
        if (!window.confirm('Cancel order #' + String(orderId).padStart(6, '0') + '? This cannot be undone.')) return;
        button.disabled = true;
        button.textContent = 'Cancelling…';
        var result = await SSPH_DB.cancelMyOrder(orderId);
        if (!result.ok) {
          showError(result.error);
          button.disabled = false;
          button.textContent = 'Cancel order';
          return;
        }
        await refreshOrders();
        notice.textContent = 'Order #' + String(orderId).padStart(6, '0') + ' was cancelled.';
        notice.className = 'owner-notice';
      });
    });
  }

  async function refreshOrders() {
    var result = await SSPH_DB.myOrders();
    if (!result.ok) {
      showError('Could not load your orders: ' + result.error);
      return;
    }
    renderOrders(result.data);
    notice.textContent = 'Orders updated at ' + new Date().toLocaleTimeString();
    notice.className = 'owner-notice';
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshOrders, 150);
  }

  async function start() {
    if (!(await SSPH_DB.requireSession('login.html?redirect=orders.html'))) return;
    await refreshOrders();
    var subscription = await SSPH_DB.watchOrders(false, scheduleRefresh, function (status, error) {
      if (status === 'SUBSCRIBED') {
        liveStatus.textContent = 'Live updates on';
        liveStatus.className = 'live-indicator connected';
        scheduleRefresh();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        liveStatus.textContent = 'Reconnecting to live updates…';
        liveStatus.className = 'live-indicator disconnected';
        if (error) console.error('[Orders] Realtime subscription error:', error);
      } else if (status === 'CLOSED') {
        liveStatus.textContent = 'Live updates disconnected';
        liveStatus.className = 'live-indicator disconnected';
      }
    });
    if (!subscription.ok) {
      liveStatus.textContent = 'Live updates unavailable';
      liveStatus.className = 'live-indicator disconnected';
      showError('Live order updates unavailable: ' + subscription.error);
    }
  }

  window.setInterval(function () {
    if (!document.hidden) refreshOrders();
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshOrders();
  });
  start();
})();
