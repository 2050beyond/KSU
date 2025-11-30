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

// Legacy function name - redirects to updateCart for backwards compatibility
async function renderCart() {
  return updateCart();
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

      // Update cart data after removal
      await updateCart();
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

  // Click handler - Prevent navigation, toggle dropdown (Mobile & Desktop)
  if (cartLink && miniCart) {
    let hoverTimeout;
    
    // Click event - ALWAYS prevent navigation, instant toggle
    cartLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (isMobile) {
        // Mobile: Toggle overlay (instant, no fetch)
        const isOpen = miniCart.classList.contains('is-open');
        toggleCart(!isOpen);
      } else {
        // Desktop: Toggle dropdown (instant, no fetch)
        const isActive = miniCart.classList.contains('active');
        
        if (isActive) {
          // Already open from hover - close it
          toggleCart(false);
        } else {
          // Not open - open it (instant)
          clearTimeout(hoverTimeout);
          toggleCart(true);
        }
      }
    });

    // Desktop: hover cart (instant open, no fetch)
    cartLink.addEventListener('mouseenter', () => {
      if (!isMobile) {
        clearTimeout(hoverTimeout);
        toggleCart(true);
      }
    });

    cartLink.addEventListener('mouseleave', () => {
      if (!isMobile) {
        hoverTimeout = setTimeout(() => {
          toggleCart(false);
        }, 500);
      }
    });

    miniCart.addEventListener('mouseenter', () => {
      if (!isMobile) {
        clearTimeout(hoverTimeout);
        toggleCart(true);
      }
    });

    miniCart.addEventListener('mouseleave', () => {
      if (!isMobile) {
        hoverTimeout = setTimeout(() => {
          toggleCart(false);
        }, 500);
      }
    });

    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => {
        if (isMobile) {
          toggleCart(false);
        }
      });
    }

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (isMobile && miniCart.classList.contains('is-open')) {
        if (!cartLink.contains(e.target) && !miniCart.contains(e.target) && !cartOverlay.contains(e.target)) {
          toggleCart(false);
        }
      }
    });
  }

  // Initial cart render on page load (only once)
  updateCartCount();
  updateCart();
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
      
      // Update cart data after adding item
      await updateCartCount();
      await updateCart();
      
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

// Carousel Navigation - Native Scroll Snap with Circular Looping
document.addEventListener('click', function(event) {
  const arrow = event.target.closest('.carousel-arrow-ghost');
  if (!arrow) return;

  event.preventDefault();
  event.stopPropagation();

  const container = arrow.closest('.image-carousel-container');
  if (!container) return;

  const track = container.querySelector('.carousel-track');
  if (!track) return;

  const direction = arrow.dataset.direction;
  const scrollLeft = track.scrollLeft;
  const scrollWidth = track.scrollWidth;
  const clientWidth = track.clientWidth;

  if (direction === 'next') {
    // Check if we're at or near the end
    if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth) {
      // Loop to beginning
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      // Scroll forward one image
      track.scrollBy({ left: clientWidth, behavior: 'smooth' });
    }
  } else {
    // Prev arrow
    // Check if we're at the start
    if (scrollLeft === 0) {
      // Loop to end
      track.scrollTo({ left: scrollWidth, behavior: 'smooth' });
    } else {
      // Scroll backward one image
      track.scrollBy({ left: -clientWidth, behavior: 'smooth' });
    }
  }
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
