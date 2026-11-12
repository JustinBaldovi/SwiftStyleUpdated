/* Customer support inbox. Message ownership and rating rules are enforced by Supabase RLS. */
(function () {
  'use strict';

  var list = document.getElementById('customer-support-messages');
  var notice = document.getElementById('inbox-notice');
  var status = document.getElementById('inbox-live-status');
  var refreshing = false;
  var refreshQueued = false;

  function showNotice(message, isError) {
    notice.textContent = message || '';
    notice.className = 'owner-notice' + (isError ? ' error' : '');
  }

  function dateLabel(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? '—' : date.toLocaleString();
  }

  function renderMessages(messages) {
    if (!messages.length) {
      list.innerHTML = '<div class="support-empty"><h2>Your inbox is empty</h2>' +
        '<p>Send us a message from <a href="contact.html">Contact Us</a> if you need help.</p></div>';
      return;
    }

    list.innerHTML = messages.map(function (item) {
      var replied = !!item.owner_reply;
      var rated = Number(item.rating) >= 1 && Number(item.rating) <= 5;
      var reply = replied
        ? '<section class="support-reply"><h3>Swift Style PH replied' +
          (item.owner_replied_at ? ' · ' + escapeHtml(dateLabel(item.owner_replied_at)) : '') +
          '</h3><p>' + escapeHtml(item.owner_reply) + '</p></section>'
        : '<p class="support-waiting">We received your message and will reply here.</p>';
      var rating = replied && !rated && !item.reply_seen_at
        ? '<p class="support-waiting">Marking the reply as viewed…</p>'
        : replied && !rated
        ? '<div class="support-rating"><label for="support-rating-' + Number(item.message_id) + '">How satisfied are you with our response?</label>' +
          '<select id="support-rating-' + Number(item.message_id) + '" class="support-rating-select">' +
          '<option value="">Choose a rating</option><option value="5">★★★★★ — Very satisfied</option>' +
          '<option value="4">★★★★ — Satisfied</option><option value="3">★★★ — It was okay</option>' +
          '<option value="2">★★ — Not satisfied</option><option value="1">★ — Not at all satisfied</option>' +
          '</select><button type="button" class="btn btn-small rate-support-message" data-message-id="' +
          Number(item.message_id) + '">Submit rating</button></div>'
        : rated ? '<div class="support-rating-result"><strong>Your rating:</strong> <span class="review-stars" aria-label="' +
          Number(item.rating) + ' out of 5 stars">' + '★'.repeat(Number(item.rating)) + '☆'.repeat(5 - Number(item.rating)) +
          '</span><small>Thank you for your feedback.</small></div>' : '';
      var deleteButton = replied && rated
        ? '<button type="button" class="btn btn-secondary btn-small delete-support-message" data-message-id="' +
          Number(item.message_id) + '">Delete message</button>' : '';
      return '<article class="support-message-card"><div class="support-message-heading">' +
        '<div><p class="owner-eyebrow">MESSAGE · ' + escapeHtml(dateLabel(item.created_at)) + '</p>' +
        '<h2>' + escapeHtml(item.subject) + '</h2></div>' +
        '<span class="support-status ' + (replied ? 'replied' : 'waiting') + '">' +
        (replied ? 'Owner replied' : 'Awaiting reply') + '</span></div>' +
        '<p class="support-message-body">' + escapeHtml(item.message) + '</p>' +
        reply + rating + (deleteButton ? '<div class="support-message-actions">' + deleteButton + '</div>' : '') +
        '</article>';
    }).join('');
  }

  async function refreshMessages() {
    if (refreshing) {
      refreshQueued = true;
      return;
    }
    refreshing = true;
    var result = await SSPH_DB.mySupportMessages();
    if (!result.ok) {
      showNotice('Could not load your inbox: ' + result.error, true);
      refreshing = false;
      if (refreshQueued) {
        refreshQueued = false;
        window.setTimeout(refreshMessages, 200);
      }
      return;
    }
    var messages = result.data;
    renderMessages(messages);
    var unseenReplies = messages.filter(function (item) {
      return item.owner_reply && !item.reply_seen_at;
    });
    if (unseenReplies.length) {
      var seen = await Promise.all(unseenReplies.map(function (item) {
        return SSPH_DB.markSupportReplySeen(item.message_id);
      }));
      var failed = seen.find(function (item) { return !item.ok; });
      if (failed) {
        showNotice('Could not update reply notification: ' + failed.error, true);
      } else {
        refreshQueued = true;
      }
    }
    refreshing = false;
    if (window.ssphRefreshInboxBadge) window.ssphRefreshInboxBadge();
    if (refreshQueued) {
      refreshQueued = false;
      window.setTimeout(refreshMessages, 100);
    }
  }

  list.addEventListener('click', async function (event) {
    var rateButton = event.target.closest('.rate-support-message');
    var deleteButton = event.target.closest('.delete-support-message');
    if (rateButton) {
      var select = document.getElementById('support-rating-' + rateButton.dataset.messageId);
      if (!select.value) {
        select.setCustomValidity('Choose a rating from 1 to 5 stars.');
        select.reportValidity();
        return;
      }
      rateButton.disabled = true;
      var ratingResult = await SSPH_DB.rateSupportReply(rateButton.dataset.messageId, select.value);
      if (!ratingResult.ok) {
        rateButton.disabled = false;
        showNotice('Could not save your rating: ' + ratingResult.error, true);
        return;
      }
      showNotice('Thank you for rating our response.');
      await refreshMessages();
      return;
    }
    if (deleteButton) {
      if (!window.confirm('Delete this message and its reply from your inbox? This cannot be undone.')) return;
      deleteButton.disabled = true;
      var deleteResult = await SSPH_DB.deleteMySupportMessage(deleteButton.dataset.messageId);
      if (!deleteResult.ok) {
        deleteButton.disabled = false;
        showNotice('Could not delete this message: ' + deleteResult.error, true);
        return;
      }
      showNotice('Message deleted.');
      await refreshMessages();
    }
  });
  list.addEventListener('change', function (event) {
    if (event.target.matches('.support-rating-select')) event.target.setCustomValidity('');
  });

  async function startInbox() {
    if (!(await SSPH_DB.requireSession('login.html?redirect=inbox.html'))) return;
    await refreshMessages();
    var subscription = await SSPH_DB.watchSupportMessages(false, refreshMessages, function (channelStatus) {
      if (channelStatus === 'SUBSCRIBED') {
        status.textContent = 'Live updates on';
        status.classList.add('connected');
        status.classList.remove('disconnected');
      } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT' || channelStatus === 'CLOSED') {
        status.textContent = 'Reconnecting · auto-refresh on';
        status.classList.add('disconnected');
        status.classList.remove('connected');
      }
    });
    if (!subscription.ok) {
      status.textContent = 'Auto-refresh on';
      status.classList.add('disconnected');
      showNotice('Live inbox updates are unavailable: ' + subscription.error, true);
    }
    window.setInterval(function () {
      if (!document.hidden) refreshMessages();
    }, 20000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refreshMessages();
    });
  }

  startInbox();
})();
