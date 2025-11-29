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
  
  cart.items.forEach(item => {
    const imageUrl = item.image || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png';
    const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
    
    html += `
      <div class="cart-item">
        <img src="${imageUrl}" alt="${item.title}" class="cart-item-image" loading="lazy">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          ${variantTitle ? `<div class="cart-item-variant">${variantTitle}</div>` : ''}
        </div>
        <div class="cart-item-price">${formatMoney(item.line_price)}</div>
        <button class="cart-item-remove" onclick="removeCartItem(${item.id})">remove</button>
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

// Remove item from cart
async function removeCartItem(itemId) {
  try {
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: itemId,
        quantity: 0
      })
    });

    if (!response.ok) {
      throw new Error('failed to remove item');
    }

    // Re-render cart
    await renderCart();
    
  } catch (error) {
    console.error('Error removing item:', error);
    alert('failed to remove item');
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
  let isMobile = window.innerWidth <= 768;
  
  // Check if mobile on resize
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
  });

  // Desktop: hover to show
  if (cartLink && miniCart) {
    cartLink.addEventListener('mouseenter', () => {
      if (!isMobile) {
        renderCart();
        miniCart.classList.add('active');
      }
    });

    cartLink.addEventListener('mouseleave', () => {
      if (!isMobile) {
        miniCart.classList.remove('active');
      }
    });

    // Mobile: click to toggle
    cartLink.addEventListener('click', (e) => {
      if (isMobile) {
        e.preventDefault();
        if (miniCart.classList.contains('active')) {
          miniCart.classList.remove('active');
        } else {
          renderCart();
          miniCart.classList.add('active');
        }
      }
    });

    // Close dropdown when clicking outside (mobile)
    document.addEventListener('click', (e) => {
      if (isMobile && miniCart.classList.contains('active')) {
        if (!cartLink.contains(e.target) && !miniCart.contains(e.target)) {
          miniCart.classList.remove('active');
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
      if (miniCart && miniCart.classList.contains('active')) {
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

// Make functions globally available
window.updateCartCount = updateCartCount;
window.renderCart = renderCart;
window.removeCartItem = removeCartItem;
