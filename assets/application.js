async function buyNow(element) {
  const variantId = element.dataset.variantId;
  const productId = element.dataset.productId;
  
  if (!variantId || !productId) {
    return;
  }
  
  // Disable the button to prevent double-clicks
  element.style.pointerEvents = 'none';
  element.style.opacity = '0.6';
  
  try {
    // Add to cart via AJAX
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
      throw new Error('Failed to add to cart');
    }
    
    // Immediately redirect to checkout
    window.location.href = '/checkout';
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    // Re-enable the button on error
    element.style.pointerEvents = 'auto';
    element.style.opacity = '1';
    alert('Failed to add item to cart. Please try again.');
  }
}

