export const placeholderImage = (label = 'Profile') => {
  const safeLabel = encodeURIComponent(label || 'Profile');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23e91e63'/%3E%3Cstop offset='1' stop-color='%23673ab7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='500' fill='url(%23g)'/%3E%3Ccircle cx='200' cy='175' r='64' fill='rgba(255,255,255,.82)'/%3E%3Cpath d='M88 405c18-75 78-118 112-118s94 43 112 118' fill='rgba(255,255,255,.82)'/%3E%3Ctext x='200' y='462' font-size='28' font-family='Arial' text-anchor='middle' fill='white'%3E${safeLabel}%3C/text%3E%3C/svg%3E`;
};

export const getImageUrl = (url, label = 'Profile') => {
  if (!url) return placeholderImage(label);

  if (url.startsWith('/uploads/')) {
    return url;
  }

  if (url.startsWith('http://localhost:5173/uploads/') || url.startsWith('http://127.0.0.1:5173/uploads/')) {
    return new URL(url).pathname;
  }

  if (url.startsWith('http://localhost:3000/uploads/') || url.startsWith('http://127.0.0.1:3000/uploads/')) {
    return new URL(url).pathname;
  }

  return url;
};

export const handleImageError = (event, label = 'Profile') => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = placeholderImage(label);
};
