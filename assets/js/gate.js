/* Swift Style PH — login gate (runs in <head> so protected pages never flash).
   Visitors who are not signed in are sent to login.html. */
(function () {
  var page = location.pathname.split('/').pop() || 'index.html';
  var authPages = ['login.html', 'register.html'];
  var user = null;
  try { user = JSON.parse(localStorage.getItem('ssph_current_user') || 'null'); } catch (e) {}

  if (!user && authPages.indexOf(page) === -1) {
    document.documentElement.style.visibility = 'hidden';
    location.replace('login.html?redirect=' + encodeURIComponent(page + location.search));
  } else if (user && authPages.indexOf(page) !== -1) {
    document.documentElement.style.visibility = 'hidden';
    location.replace('index.html');
  }
})();
