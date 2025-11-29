// Update cart count on page load
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
    console.error('Error fetching cart:', error);
    return null;
  }
}

// Render mini cart dropdown
async function renderCart() {
  const cart = await updateCartCount();
  const miniCartContent = document.getElementById('mini-cart-content');
  
  if (!miniCartContent) return;

  if (!cart || cart.item_count === 0) {
    miniCartContent.innerHTML = '<div class="cart-empty">your cart is empty.</div>';
    return;
  }

  let html = '<div class="cart-items">';
  
  cart.items.forEach((item, index) => {
    const imageUrl = item.image || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png';
    const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
    
    html += `
      <div class="cart-item">
        <img src="${imageUrl}" alt="${item.title}" class="cart-item-image" loading="lazy">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          ${variantTitle ? `<div class="cart-item-variant">${variantTitle}</div>` : ''}
          <div class="cart-item-controls">
            <button class="cart-item-qty-btn" data-action="decrease" data-key="${item.key}" data-quantity="${item.quantity}">−</button>
            <span class="cart-item-quantity">${item.quantity}</span>
            <button class="cart-item-qty-btn" data-action="increase" data-key="${item.key}" data-quantity="${item.quantity}">+</button>
            <button class="cart-item-remove remove-item" data-key="${item.key}">remove</button>
          </div>
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

// Remove item from cart using event delegation
async function handleCartAction(event) {
  const cartDropdown = document.getElementById('mini-cart');
  if (!cartDropdown) return;

  // Handle remove button - use closest to find the button even if clicking on text
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

      // Re-fetch and re-render cart immediately
      await renderCart();
      
    } catch (error) {
      console.error('Error removing item:', error);
      alert('failed to remove item');
    }
    return;
  }

  // Handle quantity increase/decrease - use closest to find the button
  const qtyBtn = event.target.closest('.cart-item-qty-btn');
  if (qtyBtn) {
    event.preventDefault();
    event.stopPropagation();
    
    const action = qtyBtn.dataset.action;
    const itemKey = qtyBtn.dataset.key;
    const currentQuantity = parseInt(qtyBtn.dataset.quantity) || 1;
    
    if (!itemKey) return;

    let newQuantity = currentQuantity;
    if (action === 'increase') {
      newQuantity = currentQuantity + 1;
    } else if (action === 'decrease') {
      newQuantity = Math.max(0, currentQuantity - 1);
    }

    // If quantity becomes 0, remove the item
    if (newQuantity === 0) {
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
        return;
      } catch (error) {
        console.error('Error removing item:', error);
        alert('failed to remove item');
        return;
      }
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        throw new Error('failed to update quantity');
      }

      // Re-fetch and re-render cart immediately
      await renderCart();
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('failed to update quantity');
    }
  }
}

// Format money (Shopify format)
function formatMoney(cents) {
  // Get currency from cart or use default
  const currency = window.Shopify?.currency?.active || 'USD';
  const amount = cents / 100;
  
  // Simple formatting - Shopify will handle currency symbol
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

// Mini cart dropdown interactions
document.addEventListener('DOMContentLoaded', function() {
  const cartLink = document.getElementById('cart-link');
  const miniCart = document.getElementById('mini-cart');
  const cartOverlay = document.getElementById('cart-overlay');
  let isMobile = window.innerWidth <= 768;
  
  // Check if mobile on resize
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
  });

  // Event delegation for cart actions (remove, quantity)
  // Attach to the cart dropdown container for reliable event delegation
  if (miniCart) {
    miniCart.addEventListener('click', handleCartAction);
  }

  // Desktop: hover to show with reliable transitions
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

    // Keep dropdown open when hovering over it
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

    // Mobile: click to toggle with overlay
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

    // Close cart when clicking overlay (mobile)
    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => {
        if (isMobile) {
          miniCart.classList.remove('is-open');
          cartOverlay.classList.remove('is-open');
        }
      });
    }

    // Close dropdown when clicking outside (mobile)
    document.addEventListener('click', (e) => {
      if (isMobile && miniCart.classList.contains('is-open')) {
        if (!cartLink.contains(e.target) && !miniCart.contains(e.target) && !cartOverlay.contains(e.target)) {
          miniCart.classList.remove('is-open');
          if (cartOverlay) cartOverlay.classList.remove('is-open');
        }
      }
    });
  }

  // Initialize cart count
  updateCartCount();
});

// Handle add to cart form submission (from product page)
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
      
      // Update cart count and render mini cart if open
      await updateCartCount();
      const miniCart = document.getElementById('mini-cart');
      if (miniCart && (miniCart.classList.contains('active') || miniCart.classList.contains('is-open'))) {
        await renderCart();
      }
      
      // Optional: Show feedback
      const button = this.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      button.textContent = 'added';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('failed to add item to cart');
    }
  });
}

// Carousel Navigation (Event Delegation)
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

// Make functions globally available
window.updateCartCount = updateCartCount;
window.renderCart = renderCart;
