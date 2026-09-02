export const CUSTOMER_TYPES = ['Hot', 'Cold', 'Warm'];

export function customerTypeBadgeClass(type) {
  if (type === 'Hot') return 'badge-hot';
  if (type === 'Cold') return 'badge-cold';
  if (type === 'Warm') return 'badge-warm';
  return '';
}
