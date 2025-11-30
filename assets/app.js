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

// Update cart HTML content (returns Promise)
async function updateCartHTML() {
  const miniCartContent = document.getElementById('mini-cart-content');
  if (!miniCartContent) return;

  try {
    // Fetch cart data
    const cart = await updateCartCount();
    
    // Build new HTML (don't clear old HTML until new one is ready)
    let html = '';
    
    if (!cart || cart.item_count === 0) {
      html = '<div class="cart-empty">your bag is empty.</div>';
    } else {
      html = '<div class="cart-items">';
      
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
    }
    
    // Only swap HTML after new content is ready (prevents flash)
    miniCartContent.innerHTML = html;
  } catch (error) {
    console.error('Error updating cart HTML:', error);
  }
}

// Alias for backwards compatibility
async function updateCart() {
  return updateCartHTML();
}

// Legacy function name - redirects to updateCart for backwards compatibility
async function renderCart() {
  return updateCartHTML();
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
      await updateCartHTML();
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

// Toggle cart visibility (instant, no fetch)
function toggleCart(open) {
  const cartLink = document.getElementById('cart-link');
  const miniCart = document.getElementById('mini-cart');
  const cartOverlay = document.getElementById('cart-overlay');
  const isMobile = window.innerWidth <= 768;
  
  if (!cartLink || !miniCart) return;
  
  if (isMobile) {
    if (open) {
      miniCart.classList.add('is-open');
      if (cartOverlay) cartOverlay.classList.add('is-open');
      cartLink.setAttribute('aria-expanded', 'true');
    } else {
      miniCart.classList.remove('is-open');
      if (cartOverlay) cartOverlay.classList.remove('is-open');
      cartLink.setAttribute('aria-expanded', 'false');
    }
  } else {
    if (open) {
      miniCart.classList.remove('fade-out');
      miniCart.classList.add('active');
      cartLink.setAttribute('aria-expanded', 'true');
    } else {
      miniCart.classList.add('fade-out');
      setTimeout(() => {
        miniCart.classList.remove('active');
        miniCart.classList.remove('fade-out');
        cartLink.setAttribute('aria-expanded', 'false');
      }, 500);
    }
  }
}

// Open bag dropdown (distinct function for clarity)
function openBag() {
  const cartLink = document.getElementById('cart-link');
  const miniCart = document.getElementById('mini-cart');
  const cartOverlay = document.getElementById('cart-overlay');
  const isMobile = window.innerWidth <= 768;
  
  if (!cartLink || !miniCart) return;
  
  // Clear any existing auto-close timers
  if (window.cartHoverTimeout) {
    clearTimeout(window.cartHoverTimeout);
    window.cartHoverTimeout = null;
  }
  
  if (isMobile) {
    miniCart.classList.add('is-open');
    if (cartOverlay) cartOverlay.classList.add('is-open');
    cartLink.setAttribute('aria-expanded', 'true');
  } else {
    miniCart.classList.remove('fade-out');
    miniCart.classList.add('active');
    cartLink.setAttribute('aria-expanded', 'true');
  }
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
  updateCartHTML();
});

// Add to Cart Form (Product Page)
// Add to cart form handler using FormData (only if not already handled in main-product.liquid)
const addToCartForm = document.getElementById('add-to-cart-form');
if (addToCartForm && !addToCartForm.hasAttribute('data-handler-attached')) {
  addToCartForm.setAttribute('data-handler-attached', 'true');
  
  addToCartForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const button = form.querySelector('.add-to-cart-btn');
    
    // Don't allow adding sold out items
    if (button && (button.classList.contains('is-sold') || button.disabled)) {
      return;
    }

    // Create FormData from the form
    const formData = new FormData(form);
    const variantId = formData.get('id');
    
    // Debug: Log the variant ID
    console.log('Adding Variant ID:', variantId);
    
    // Validation: Check if variant ID exists
    if (!variantId) {
      console.error('No variant ID found in form');
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'adding...';
    }
    
    try {
      // Use Shopify routes if available, otherwise fallback
      const cartAddUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) 
        ? window.Shopify.routes.root + 'cart/add.js'
        : '/cart/add.js';

      const response = await fetch(cartAddUrl, {
        method: 'POST',
        body: formData
      });

      const responseData = await response.json();

      if (response.status === 422 || !response.ok) {
        console.error("Sold Out / Error", responseData);
        
        // Update button to "Sold Out" state
        if (button) {
          button.textContent = 'sold';
          button.classList.add('is-sold');
          button.disabled = true;
        }
        return;
      }

      // SUCCESS!
      // 1. Update cart HTML first (await to ensure it completes)
      if (typeof updateCartHTML === 'function') {
        await updateCartHTML();
      }
      
      // 2. Update cart count in header
      if (typeof updateCartCount === 'function') {
        updateCartCount();
      }
      
      // 3. Open the Bag Dropdown
      if (typeof openBag === 'function') {
        openBag();
      }
      
      if (button) {
        button.textContent = 'added to bag';
        setTimeout(() => {
          button.textContent = 'add to bag';
          button.disabled = false;
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Restore button state
      if (button) {
        button.disabled = false;
        button.textContent = 'add to bag';
        button.classList.remove('is-sold');
      }
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
window.updateCart = updateCart;
window.updateCartHTML = updateCartHTML;
window.toggleCart = toggleCart;
window.toggleBag = toggleCart; // Alias for consistency
window.openBag = openBag;
