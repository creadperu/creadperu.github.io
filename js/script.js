document.addEventListener('DOMContentLoaded', function () {
  // Initialize cart from localStorage or empty array
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  updateCartCount();

  // Active Link Highlighting
  const activePage = window.location.pathname;
  const navLinksItems = document.querySelectorAll('.nav-links a');

  function setActiveLink() {
    const hash = window.location.hash;
    const path = window.location.pathname;

    navLinksItems.forEach(link => {
      const href = link.getAttribute('href');

      // Remove active class from all first
      link.classList.remove('active');

      // Logic for basic pages
      if (href.includes('.html') && !href.includes('#')) {
        if (path.includes(href) || (href === 'index.html' && (path.endsWith('/') || path.endsWith('index.html')))) {
          link.classList.add('active');
        }
      }
      // Logic for hash links on the same page (mainly for index.html)
      else if (href.startsWith('#') || href.includes('#')) {
        const linkHash = href.includes('#') ? href.split('#')[1] : href.substring(1);
        if ((path.endsWith('/') || path.endsWith('index.html')) && hash === '#' + linkHash) {
          link.classList.add('active');
        }
      }
    });
  }

  // Set initial active link
  setActiveLink();

  // Update on hash change
  window.addEventListener('hashchange', setActiveLink);

  // Enhanced mobile menu toggle functionality
  const menuToggle = document.createElement('div');
  menuToggle.className = 'menu-toggle';
  menuToggle.setAttribute('role', 'button');
  menuToggle.setAttribute('aria-label', 'Toggle menu');
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';

  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');

  nav.insertBefore(menuToggle, navLinks);

  // Improved click handler with debounce
  let isMenuAnimating = false;

  menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMenuAnimating) return;
    isMenuAnimating = true;

    navLinks.classList.toggle('active');
    menuToggle.innerHTML = navLinks.classList.contains('active')
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';

    setTimeout(() => {
      isMenuAnimating = false;
    }, 200);
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });

  // Cart icon click handler
  const cartIcon = document.querySelector('.cart-icon');
  cartIcon.addEventListener('click', () => {
    window.location.href = 'cart.html';
  });

  // Add to cart functionality
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.material-card, .producto-card');

      // Determine price element
      const priceElement = card.querySelector('.precio-liquid') ||
        card.querySelector('.precio') ||
        card.querySelector('.material-price');

      let priceText = priceElement ? priceElement.textContent : '0';
      // Clean price string
      priceText = priceText.replace('S/', '').replace('From ', '').replace(' por metro', '').trim();

      const product = {
        id: Date.now(), // Unique identifier
        name: card.querySelector('h3').textContent,
        price: parseFloat(priceText),
        image: card.querySelector('img').src,
        quantity: 1
      };

      addToCart(product);
      showNotification('Producto agregado al carrito');
    });
  });

  // Cart page specific functionality
  if (window.location.pathname.includes('cart.html')) {
    renderCart();
  }

  function addToCart(product) {
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push(product);
    }
    saveCart();
    updateCartCount();
  }

  function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function renderCart() {
    const cartItems = document.querySelector('.cart-items');
    if (!cartItems) return;

    // Add clear cart button functionality
    const clearCartButton = document.querySelector('.clear-cart-button');
    if (clearCartButton) {
      clearCartButton.addEventListener('click', clearCart);
    }

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart-message">Tu carrito está vacío</div>';
      return;
    }

    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
        </div>
        <div class="cart-item-price">S/${item.price.toFixed(2)}</div>
        <div class="quantity-controls">
          <button class="decrease-quantity">-</button>
          <input type="number" value="${item.quantity}" min="1">
          <button class="increase-quantity">+</button>
        </div>
        <div class="subtotal">S/${(item.price * item.quantity).toFixed(2)}</div>
        <button class="remove-item">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');

    updateTotal();
    addCartEventListeners();
  }

  function addCartEventListeners() {
    document.querySelectorAll('.decrease-quantity').forEach(button => {
      button.addEventListener('click', () => updateQuantity(button, -1));
    });

    document.querySelectorAll('.increase-quantity').forEach(button => {
      button.addEventListener('click', () => updateQuantity(button, 1));
    });

    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', () => removeItem(button));
    });

    document.querySelectorAll('.quantity-controls input').forEach(input => {
      input.addEventListener('change', () => updateQuantityFromInput(input));
    });
  }

  function updateQuantity(button, change) {
    const item = button.closest('.cart-item');
    const input = item.querySelector('input');
    const id = parseInt(item.dataset.id);
    const cartItem = cart.find(item => item.id === id);

    const newQuantity = Math.max(1, parseInt(input.value) + change);
    input.value = newQuantity;
    cartItem.quantity = newQuantity;

    updateItemSubtotal(item, cartItem);
    saveCart();
    updateCartCount();
    updateTotal();
  }

  function updateQuantityFromInput(input) {
    const item = input.closest('.cart-item');
    const id = parseInt(item.dataset.id);
    const cartItem = cart.find(item => item.id === id);

    const newQuantity = Math.max(1, parseInt(input.value));
    input.value = newQuantity;
    cartItem.quantity = newQuantity;

    updateItemSubtotal(item, cartItem);
    saveCart();
    updateCartCount();
    updateTotal();
  }

  function removeItem(button) {
    const item = button.closest('.cart-item');
    const id = parseInt(item.dataset.id);
    cart = cart.filter(item => item.id !== id);

    saveCart();
    updateCartCount();
    renderCart();
  }

  function updateItemSubtotal(item, cartItem) {
    const subtotal = cartItem.price * cartItem.quantity;
    item.querySelector('.subtotal').textContent = `S/${subtotal.toFixed(2)}`;
  }

  function updateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalElement = document.querySelector('.total-amount');
    if (totalElement) {
      totalElement.textContent = `S/${total.toFixed(2)}`;
    }
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    renderCart();
    showNotification('El carrito ha sido vaciado');
  }

  // Enhanced notification system
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: type === 'success' ? 'var(--primary-color)' : 'var(--secondary-color)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 10000
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Animaciones para el scroll
  const sections = document.querySelectorAll('section');

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 0.5s ease-out';
    observer.observe(section);
  });

  // Enhanced form validation
  const newsletterForm = document.querySelector('.newsletter-form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input');
      const email = emailInput.value;

      if (!email) {
        showNotification('Por favor ingresa tu email', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
      }

      showNotification('¡Gracias por suscribirte!');
      newsletterForm.reset();
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Add smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Carousel Functionality
  let slideIndex = 0;
  const slides = document.querySelectorAll('.carousel-slide');

  // Make moveSlide global for onclick handlers
  window.moveSlide = function (n) {
    showSlides(slideIndex += n);
  };

  function showSlides(n) {
    if (!slides.length) return;

    if (n >= slides.length) { slideIndex = 0 }
    if (n < 0) { slideIndex = slides.length - 1 }

    slides.forEach(slide => slide.classList.remove('active'));
    slides[slideIndex].classList.add('active');
  }

  // Auto slide
  if (slides.length > 0) {
    setInterval(() => {
      window.moveSlide(1);
    }, 5000); // 5 seconds
  }
});