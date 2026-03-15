document.addEventListener('DOMContentLoaded', function () {
  // ─── Cart State ─────────────────────────────────────────
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  updateCartCount();

  // ─── Mobile Menu Toggle ──────────────────────────────────
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';

  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');

  if (nav && navLinks) {
    nav.insertBefore(menuToggle, navLinks);

    let isMenuAnimating = false;
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isMenuAnimating) return;
      isMenuAnimating = true;
      navLinks.classList.toggle('active');
      const isOpen = navLinks.classList.contains('active');
      menuToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      setTimeout(() => { isMenuAnimating = false; }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });

    // Close menu on anchor click (single-page nav)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });
  }

  // ─── Dropdown — JS completo (desktop hover + mobile click) ──
  let dropdownHideTimer = null;

  document.querySelectorAll('.has-dropdown').forEach(item => {
    const trigger = item.querySelector('.dropdown-trigger');
    const menu    = item.querySelector('.dropdown-menu');
    if (!trigger || !menu) return;

    const openMenu = () => {
      clearTimeout(dropdownHideTimer);
      // Cierra cualquier otro dropdown abierto
      document.querySelectorAll('.has-dropdown.open').forEach(i => {
        if (i !== item) i.classList.remove('open');
      });
      item.classList.add('open');
    };

    const closeMenu = (delay = 0) => {
      clearTimeout(dropdownHideTimer);
      if (delay) {
        dropdownHideTimer = setTimeout(() => item.classList.remove('open'), delay);
      } else {
        item.classList.remove('open');
      }
    };

    // Desktop: mouseenter/mouseleave con delay de salida para poder llegar al menú
    item.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 768) return;
      openMenu();
    });
    item.addEventListener('mouseleave', () => {
      if (window.innerWidth <= 768) return;
      closeMenu(180);    // 180ms de gracia para mover el cursor al menú
    });

    // Click en trigger:
    //   Desktop → navega a #categorias
    //   Mobile  → abre/cierra el submenu inline
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.innerWidth > 768) {
        // Desktop: navegar a #categorias
        const cat = document.getElementById('categorias');
        if (cat) cat.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMenu();
      } else {
        // Mobile: toggle
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.has-dropdown.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) openMenu();
      }
    });

    // Click en un ítem del menú → cerrar inmediatamente después
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });
  });

  // Click fuera → cerrar todos los dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown.open').forEach(i => i.classList.remove('open'));
    }
  });

  // ─── Announcement Bar Dismiss ────────────────────────────
  const announcementBar = document.getElementById('announcement-bar');
  const closeAnnouncement = document.getElementById('close-announcement');
  const ANNOUNCEMENT_KEY = 'cread_announcement_dismissed_v1';

  if (announcementBar) {
    if (localStorage.getItem(ANNOUNCEMENT_KEY)) {
      announcementBar.style.display = 'none';
      document.documentElement.style.setProperty('--announcement-height', '0px');
    } else {
      const h = announcementBar.offsetHeight;
      document.documentElement.style.setProperty('--announcement-height', h + 'px');
    }

    if (closeAnnouncement) {
      closeAnnouncement.addEventListener('click', () => {
        announcementBar.classList.add('dismissed');
        localStorage.setItem(ANNOUNCEMENT_KEY, 'true');
        setTimeout(() => {
          announcementBar.style.display = 'none';
          document.documentElement.style.setProperty('--announcement-height', '0px');
        }, 320);
      });
    }
  }

  // ─── Sticky Header Shrink on Scroll ──────────────────────
  const mainHeader = document.getElementById('main-header');
  if (mainHeader) {
    window.addEventListener('scroll', () => {
      mainHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ─── Active Nav Link via IntersectionObserver ─────────────
  // Sections grouped under "Productos" dropdown
  const PRODUCTOS_IDS = new Set(['materiales', 'accesorios', 'maquinas']);
  const dropdownTrigger = document.querySelector('.nav-links .dropdown-trigger');

  // Collect all sections that have a nav anchor OR belong to Productos dropdown
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  const allSectionIds = new Set();

  navAnchors.forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    allSectionIds.add(id);
  });
  // Also add Productos sub-sections (materiales, accesorios, maquinas)
  PRODUCTOS_IDS.forEach(id => allSectionIds.add(id));

  const sections = [];
  allSectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) sections.push(el);
  });

  if (sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          // Clear all active states
          navAnchors.forEach(a => a.classList.remove('active'));

          if (PRODUCTOS_IDS.has(id)) {
            // Activate the "Productos" dropdown trigger
            if (dropdownTrigger) dropdownTrigger.classList.add('active');
          } else {
            // Activate the matching nav link
            const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
            if (activeLink) activeLink.classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    sections.forEach(el => navObserver.observe(el));
  }

  // ─── Cart Icon Click ─────────────────────────────────────
  const cartIcon = document.querySelector('.cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  // ─── Add to Cart ─────────────────────────────────────────
  document.querySelectorAll('.add-to-cart, .card-quick-add, .kit-cta').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = button.closest('.material-card, .producto-card, .kit-card');
      if (!card) return;

      const priceEl = card.querySelector('.precio-liquid, .precio, .material-price');
      let priceText = priceEl ? priceEl.textContent : '0';
      priceText = priceText.replace(/S\/|por metro|Desde\s*/gi, '').trim();

      const product = {
        id: Date.now(),
        name: card.querySelector('h3').textContent.trim(),
        price: parseFloat(priceText) || 0,
        image: card.querySelector('img') ? card.querySelector('img').src : '',
        quantity: 1
      };

      addToCart(product);
      showNotification('¡Producto agregado al carrito!');
    });
  });

  // ─── Cart Page ───────────────────────────────────────────
  if (window.location.pathname.includes('cart.html')) {
    renderCart();
    setupCheckoutButton();
  }

  function addToCart(product) {
    const existing = cart.find(i => i.name === product.name);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push(product);
    }
    saveCart();
    updateCartCount();
  }

  function updateCartCount() {
    const total = cart.reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = total;
    });
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function renderCart() {
    const cartItems = document.querySelector('.cart-items');
    if (!cartItems) return;

    const clearBtn = document.querySelector('.clear-cart-button');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart-message">
          <i class="fas fa-shopping-bag" style="font-size:3rem; margin-bottom:1rem; display:block; color:var(--clr-border)"></i>
          Tu carrito está vacío
          <br><a href="index.html" style="color:var(--clr-primary); font-weight:600; margin-top:1rem; display:inline-block;">Seguir comprando</a>
        </div>`;
      return;
    }

    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info"><h3>${item.name}</h3></div>
        <div class="cart-item-price">S/${item.price.toFixed(2)}</div>
        <div class="quantity-controls">
          <button class="decrease-quantity">−</button>
          <input type="number" value="${item.quantity}" min="1">
          <button class="increase-quantity">+</button>
        </div>
        <div class="subtotal">S/${(item.price * item.quantity).toFixed(2)}</div>
        <button class="remove-item"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');

    updateTotal();
    addCartEventListeners();
  }

  function addCartEventListeners() {
    document.querySelectorAll('.decrease-quantity').forEach(btn => {
      btn.addEventListener('click', () => updateQuantity(btn, -1));
    });
    document.querySelectorAll('.increase-quantity').forEach(btn => {
      btn.addEventListener('click', () => updateQuantity(btn, 1));
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn));
    });
    document.querySelectorAll('.quantity-controls input').forEach(input => {
      input.addEventListener('change', () => updateQuantityFromInput(input));
    });
  }

  function updateQuantity(button, change) {
    const item = button.closest('.cart-item');
    const input = item.querySelector('input');
    const id = parseInt(item.dataset.id);
    const cartItem = cart.find(i => i.id === id);
    const newQty = Math.max(1, parseInt(input.value) + change);
    input.value = newQty;
    cartItem.quantity = newQty;
    updateItemSubtotal(item, cartItem);
    saveCart();
    updateCartCount();
    updateTotal();
  }

  function updateQuantityFromInput(input) {
    const item = input.closest('.cart-item');
    const id = parseInt(item.dataset.id);
    const cartItem = cart.find(i => i.id === id);
    const newQty = Math.max(1, parseInt(input.value) || 1);
    input.value = newQty;
    cartItem.quantity = newQty;
    updateItemSubtotal(item, cartItem);
    saveCart();
    updateCartCount();
    updateTotal();
  }

  function removeItem(button) {
    const item = button.closest('.cart-item');
    const id = parseInt(item.dataset.id);
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartCount();
    renderCart();
  }

  function updateItemSubtotal(item, cartItem) {
    item.querySelector('.subtotal').textContent = `S/${(cartItem.price * cartItem.quantity).toFixed(2)}`;
  }

  function updateTotal() {
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const el = document.querySelector('.total-amount');
    if (el) el.textContent = `S/${total.toFixed(2)}`;
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    renderCart();
    showNotification('El carrito ha sido vaciado');
  }

  // ─── WhatsApp Checkout ────────────────────────────────────
  function setupCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-button');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
      }
      const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const itemLines = cart.map(i =>
        `• ${i.name} x${i.quantity} = S/${(i.price * i.quantity).toFixed(2)}`
      ).join('%0A');
      const msg = `Hola! Quiero hacer un pedido en CreadPeru:%0A%0A${itemLines}%0A%0A*Total: S/${total.toFixed(2)}*%0A%0A¿Cómo procedo con el pago?`;
      window.open(`https://wa.me/51985605911?text=${msg}`, '_blank');
    });
  }

  // ─── Notification System ──────────────────────────────────
  function showNotification(message, type = 'success') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = `notification${type === 'error' ? ' error' : ''}`;
    n.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(n);
    setTimeout(() => {
      n.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => n.remove(), 300);
    }, 3000);
  }

  // ─── Scroll Reveal ────────────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ─── Carousel ─────────────────────────────────────────────
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  let slideIndex = 0;
  let autoSlideInterval;

  window.moveSlide = function (n) {
    showSlides(slideIndex + n);
  };

  function showSlides(n) {
    if (!slides.length) return;
    slideIndex = ((n % slides.length) + slides.length) % slides.length;
    slides.forEach(s => s.classList.remove('active'));
    slides[slideIndex].classList.add('active');
    dots.forEach(d => d.classList.remove('active'));
    if (dots[slideIndex]) dots[slideIndex].classList.add('active');
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(autoSlideInterval);
      showSlides(i);
      startAutoSlide();
    });
  });

  function startAutoSlide() {
    autoSlideInterval = setInterval(() => window.moveSlide(1), 5000);
  }

  if (slides.length > 1) startAutoSlide();

  const carousel = document.getElementById('main-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    carousel.addEventListener('mouseleave', () => startAutoSlide());
  }

  // ─── FAQ Accordion ────────────────────────────────────────
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all open items
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      // Toggle clicked item
      if (!isOpen) item.classList.add('open');
    });
  });

  // ─── Newsletter Form ──────────────────────────────────────
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) { showNotification('Por favor ingresa tu correo electrónico', 'error'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification('Por favor ingresa un correo válido', 'error'); return; }
      showNotification('¡Gracias! Revisa tu correo para tu 10% de descuento.');
      newsletterForm.reset();
    });
  }

  // ─── Product Sort (multi-section single page) ─────────────
  document.querySelectorAll('.sort-select').forEach(sortSelect => {
    sortSelect.addEventListener('change', () => {
      const section = sortSelect.closest('section, div[id]');
      if (!section) return;
      const grid = section.querySelector('.productos-grid, .materials-grid');
      if (!grid) return;
      const cards = Array.from(grid.querySelectorAll('.producto-card, .material-card'));
      const value = sortSelect.value;

      const getPrice = (card) => {
        const el = card.querySelector('.precio, .material-price');
        return el ? parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;
      };
      const getName = (card) => {
        const el = card.querySelector('h3');
        return el ? el.textContent.trim() : '';
      };

      cards.sort((a, b) => {
        if (value === 'price-asc')  return getPrice(a) - getPrice(b);
        if (value === 'price-desc') return getPrice(b) - getPrice(a);
        if (value === 'name')       return getName(a).localeCompare(getName(b), 'es');
        return 0;
      });

      cards.forEach(card => grid.appendChild(card));
    });
  });

  // ─── Contact Form Feedback ────────────────────────────────
  const contactForm = document.querySelector('.contacto-form');
  if (contactForm) {
    contactForm.addEventListener('submit', () => {
      setTimeout(() => showNotification('¡Mensaje enviado! Te responderemos pronto.'), 500);
    });
  }
});
