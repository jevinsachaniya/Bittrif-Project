const API = 'http://localhost:3000/api';

// ── Cart ─────────────────────────────────────────────────────
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() {
  const count = getCart().reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
  showToast(`${product.name} added to cart!`);
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Format price ──────────────────────────────────────────────
function formatPrice(p) { return '₹' + Number(p).toLocaleString('en-IN'); }

// ── Nav active ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  const path = location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path.split('/').pop()) a.style.color = '#fff';
  });
});
