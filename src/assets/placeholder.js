// Placeholder image URLs for development

export const PLACEHOLDER_IMAGES = {
  product: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  category: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
  brand: 'https://images.unsplash.com/photo-1553835973-dec43bfddbeb?w=200&h=200&fit=crop',
  avatar: 'https://ui-avatars.com/api/?background=2563eb&color=fff&size=128',
  banner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
  empty: 'https://illustrations.popsy.co/gray/shopping-bag.svg',
  error: 'https://illustrations.popsy.co/gray/error.svg',
  notFound: 'https://illustrations.popsy.co/gray/not-found.svg',
};

// Fallback image handler
export const handleImageError = (e) => {
  e.target.src = PLACEHOLDER_IMAGES.product;
  e.target.onerror = null; // Prevent infinite loop
};