// Cart Management
async function updateCartCount() {
  try {
    const response = await fetch('/cart.js');
    const cart = await response.json();
    const cartCount = cart.item_count || 0;
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }
    return cart;
  } catch (error) {
    return null;
  }
}

async function renderCart() {
  const cart = await updateCartCount();
  const miniCartContent = document.getElementById('mini-cart-content');
  
  if (!miniCartContent) return;

  if (!cart || cart.item_count === 0) {
    miniCartContent.innerHTML = '<div class="cart-empty">your cart is empty.</div>';
    return;
  }

  let html = '<div class="cart-items">';
  
  cart.items.forEach((item) => {
    const imageUrl = item.image || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png';
    const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
    
    html += `
      <div class="cart-item">
        <img src="${imageUrl}" alt="${item.title}" class="cart-item-image" loading="lazy">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          ${variantTitle ? `<div class="cart-item-variant">${variantTitle}</div>` : ''}
          <button class="cart-item-remove remove-item" data-key="${item.key}">remove</button>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${formatMoney(item.line_price)}</div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  html += `
    <div class="cart-footer">
      <div class="cart-subtotal">
        <span>subtotal</span>
        <span>${formatMoney(cart.total_price)}</span>
      </div>
      <a href="/checkout" class="cart-checkout-btn" style="display: block; text-align: center; text-decoration: none;">checkout</a>
    </div>
  `;
  
  miniCartContent.innerHTML = html;
}

// Event Delegation for Cart Actions
async function handleCartAction(event) {
  const cartDropdown = document.getElementById('mini-cart');
  if (!cartDropdown) return;

  const removeBtn = event.target.closest('.remove-item');
  if (removeBtn) {
    event.preventDefault();
    event.stopPropagation();
    
    const itemKey = removeBtn.dataset.key;
    if (!itemKey) return;

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0
        })
      });

      if (!response.ok) {
        throw new Error('failed to remove item');
      }

      await renderCart();
    } catch (error) {
      alert('failed to remove item');
    }
  }
}

function formatMoney(cents) {
  const currency = window.Shopify?.currency?.active || 'USD';
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize Cart & Interactions
document.addEventListener('DOMContentLoaded', function() {
  const cartLink = document.getElementById('cart-link');
  const miniCart = document.getElementById('mini-cart');
  const cartOverlay = document.getElementById('cart-overlay');
  let isMobile = window.innerWidth <= 768;
  
  // Debounced resize handler
  const handleResize = debounce(() => {
    isMobile = window.innerWidth <= 768;
  }, 150);
  window.addEventListener('resize', handleResize);

  // Event delegation for cart actions
  if (miniCart) {
    miniCart.addEventListener('click', handleCartAction);
  }

  // Desktop: hover cart
  if (cartLink && miniCart) {
    let hoverTimeout;
    
    cartLink.addEventListener('mouseenter', () => {
      if (!isMobile) {
        clearTimeout(hoverTimeout);
        renderCart();
        miniCart.classList.remove('fade-out');
        miniCart.classList.add('active');
      }
    });

    cartLink.addEventListener('mouseleave', () => {
      if (!isMobile) {
        miniCart.classList.add('fade-out');
        hoverTimeout = setTimeout(() => {
          miniCart.classList.remove('active');
          miniCart.classList.remove('fade-out');
        }, 500);
      }
    });

    miniCart.addEventListener('mouseenter', () => {
      if (!isMobile) {
        clearTimeout(hoverTimeout);
        miniCart.classList.remove('fade-out');
        miniCart.classList.add('active');
      }
    });

    miniCart.addEventListener('mouseleave', () => {
      if (!isMobile) {
        miniCart.classList.add('fade-out');
        hoverTimeout = setTimeout(() => {
          miniCart.classList.remove('active');
          miniCart.classList.remove('fade-out');
        }, 500);
      }
    });

    // Mobile: click toggle
    cartLink.addEventListener('click', (e) => {
      if (isMobile) {
        e.preventDefault();
        const isOpen = miniCart.classList.contains('is-open');
        
        if (isOpen) {
          miniCart.classList.remove('is-open');
          if (cartOverlay) cartOverlay.classList.remove('is-open');
        } else {
          renderCart();
          miniCart.classList.add('is-open');
          if (cartOverlay) cartOverlay.classList.add('is-open');
        }
      }
    });

    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => {
        if (isMobile) {
          miniCart.classList.remove('is-open');
          cartOverlay.classList.remove('is-open');
        }
      });
    }

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (isMobile && miniCart.classList.contains('is-open')) {
        if (!cartLink.contains(e.target) && !miniCart.contains(e.target) && !cartOverlay.contains(e.target)) {
          miniCart.classList.remove('is-open');
          if (cartOverlay) cartOverlay.classList.remove('is-open');
        }
      }
    });
  }

  updateCartCount();
});

// Add to Cart Form (Product Page)
const addToCartForm = document.getElementById('add-to-cart-form');
if (addToCartForm) {
  addToCartForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const variantId = formData.get('id');
    
    if (!variantId) {
      alert('please select a variant');
      return;
    }
    
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      });
      
      if (!response.ok) {
        throw new Error('failed to add to cart');
      }
      
      await updateCartCount();
      const miniCart = document.getElementById('mini-cart');
      if (miniCart && (miniCart.classList.contains('active') || miniCart.classList.contains('is-open'))) {
        await renderCart();
      }
      
      const button = this.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      button.textContent = 'added';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
      
    } catch (error) {
      alert('failed to add item to cart');
    }
  });
}

// Carousel Navigation - Event Delegation
document.addEventListener('click', function(event) {
  const arrow = event.target.closest('.carousel-arrow-ghost');
  if (!arrow) return;

  event.preventDefault();
  event.stopPropagation();

  const container = arrow.closest('.image-carousel-container');
  if (!container) return;

  const images = container.querySelectorAll('img');
  if (images.length <= 1) return;

  const activeImg = container.querySelector('.active-img');
  if (!activeImg) return;

  const currentIndex = Array.from(images).indexOf(activeImg);
  const direction = arrow.dataset.direction;
  
  let nextIndex;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % images.length;
  } else {
    nextIndex = (currentIndex - 1 + images.length) % images.length;
  }

  const nextImg = images[nextIndex];

  // Lazy load if needed
  if (nextImg.dataset.src && !nextImg.src) {
    nextImg.src = nextImg.dataset.src;
    nextImg.removeAttribute('data-src');
  }

  // Switch active class
  activeImg.classList.remove('active-img');
  activeImg.classList.add('inactive-img');
  nextImg.classList.remove('inactive-img');
  nextImg.classList.add('active-img');
});

// Page Transition - Fade In
function initPageTransition() {
  // Add loaded class on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('is-loaded');
    });
  } else {
    document.body.classList.add('is-loaded');
  }

  // Handle Safari back button (pageshow event)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      document.body.classList.add('is-loaded');
    }
  });
}

// Page Transition - Fade Out on Link Click
function initLinkTransitions() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    // Filter constraints
    const href = link.getAttribute('href');
    if (!href) return;

    // Ignore target="_blank"
    if (link.target === '_blank') return;

    // Ignore anchors (#)
    if (href.startsWith('#')) return;

    // Ignore modifier clicks (Cmd/Ctrl)
    if (event.metaKey || event.ctrlKey) return;

    // Ignore external links
    try {
      const linkUrl = new URL(href, window.location.origin);
      if (linkUrl.origin !== window.location.origin) return;
    } catch (e) {
      // Invalid URL, skip
      return;
    }

    // Ignore if href is just the current page
    if (href === window.location.pathname || href === window.location.href) return;

    // Valid internal link - trigger fade out
    event.preventDefault();
    document.body.classList.remove('is-loaded');
    
    setTimeout(() => {
      window.location.href = href;
    }, 300);
  });
}

// Initialize page transitions
initPageTransition();
initLinkTransitions();

// Global exports
window.updateCartCount = updateCartCount;
window.renderCart = renderCart;
