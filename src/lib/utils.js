// ---------------------------------------------------------------------------
// Small shared helpers. No business logic lives here.
// ---------------------------------------------------------------------------

let counter = 0;
export function uid(prefix = 'id') {
  counter += 1;
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/** Human readable countdown to a deadline, e.g. "3h 20m left" / "Expired". */
export function timeLeft(iso) {
  if (!iso) return { text: '—', expired: false, urgent: false };
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { text: 'Expired', expired: true, urgent: true };
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  let text;
  if (days >= 1) text = `${days}d ${hours % 24}h left`;
  else if (hours >= 1) text = `${hours}h ${mins % 60}m left`;
  else text = `${mins}m left`;
  return { text, expired: false, urgent: hours < 2 };
}

export function formatQuantity(quantity, unit) {
  const labels = { meals: 'meals', kg: 'kg', litres: 'L', packs: 'packs' };
  return `${quantity} ${labels[unit] || unit}`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

/** Convert a File to a compact data-URL for demo image uploads. */
export function fileToDataUrl(file, maxSize = 900) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Local datetime string for <input type="datetime-local"> values. */
export function toLocalInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}