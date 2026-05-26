// Working placeholder image service
export const getPlaceholderImage = (text, width = 400, height = 400) => {
  return `https://placehold.co/${width}x${height}/EEE/999?text=${encodeURIComponent(text || 'No Image')}`;
};

export const getProductPlaceholder = (productName) => {
  return getPlaceholderImage(productName || 'Product', 400, 400);
};

export const handleImageError = (e, fallbackText = 'No Image') => {
  e.target.src = getPlaceholderImage(fallbackText);
  e.target.onerror = null;
};