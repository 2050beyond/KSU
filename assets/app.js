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
  } catch (error) {
    console.error('Error fetching cart:', error);
  }
}

// Initialize cart count when page loads
document.addEventListener('DOMContentLoaded', updateCartCount);

// Handle add to cart form submission
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
      
      // Update cart count
      await updateCartCount();
      
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

