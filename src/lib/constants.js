// ---------------------------------------------------------------------------
// Central domain constants shared by every dashboard and service.
// ---------------------------------------------------------------------------

export const ROLES = {
  DONOR: 'donor',
  NGO: 'ngo',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  donor: 'Donor',
  ngo: 'NGO',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

export const ROLE_HOME = {
  donor: '/donor',
  ngo: '/ngo',
  volunteer: '/volunteer',
  admin: '/admin',
};

export const STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  VOLUNTEER_ASSIGNED: 'volunteer_assigned',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Ordered happy-path pipeline used by the status timeline component.
export const STATUS_FLOW = [
  STATUS.PENDING,
  STATUS.ACCEPTED,
  STATUS.VOLUNTEER_ASSIGNED,
  STATUS.PICKED_UP,
  STATUS.DELIVERED,
  STATUS.COMPLETED,
];

export const STATUS_META = {
  pending: { label: 'Pending', tone: 'amber', hint: 'Waiting for an NGO to accept' },
  accepted: { label: 'Accepted', tone: 'blue', hint: 'NGO accepted — awaiting a volunteer' },
  volunteer_assigned: { label: 'Volunteer Assigned', tone: 'violet', hint: 'A volunteer is on the way' },
  picked_up: { label: 'Picked Up', tone: 'indigo', hint: 'Food collected from donor' },
  delivered: { label: 'Delivered', tone: 'teal', hint: 'Delivered — awaiting NGO receipt confirmation' },
  completed: { label: 'Completed', tone: 'green', hint: 'Successfully redistributed' },
  rejected: { label: 'Rejected', tone: 'red', hint: 'Declined by an NGO' },
  cancelled: { label: 'Cancelled', tone: 'gray', hint: 'Cancelled by the donor' },
};

export const FOOD_CATEGORIES = [
  { value: 'cooked_meals', label: 'Cooked Meals' },
  { value: 'bakery', label: 'Bakery & Bread' },
  { value: 'fruits_vegetables', label: 'Fruits & Vegetables' },
  { value: 'packaged', label: 'Packaged Food' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'grains', label: 'Grains & Staples' },
  { value: 'sweets', label: 'Sweets & Snacks' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  FOOD_CATEGORIES.map((c) => [c.value, c.label])
);

export const UNITS = [
  { value: 'meals', label: 'Meals (servings)' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'litres', label: 'Litres' },
  { value: 'packs', label: 'Packets / Boxes' },
];

export const DIETS = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-veg' },
];

export const STORAGE_CONDITIONS = [
  { value: 'hot', label: 'Hot / Warm (insulated)' },
  { value: 'room_temp', label: 'Room temperature' },
  { value: 'refrigerated', label: 'Refrigerated' },
];

export const STORAGE_LABELS = Object.fromEntries(
  STORAGE_CONDITIONS.map((s) => [s.value, s.label])
);

export const DONOR_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hostel', label: 'Hostel / PG' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'event', label: 'Event / Caterer' },
  { value: 'individual', label: 'Individual' },
];

export const TASK_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TASK_STATUS_META = {
  open: { label: 'Open', tone: 'amber' },
  assigned: { label: 'Assigned', tone: 'violet' },
  picked_up: { label: 'Picked Up', tone: 'indigo' },
  delivered: { label: 'Delivered', tone: 'teal' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
};

export const SDG_GOALS = [
  { id: 1, title: 'No Poverty', color: '#E5243B', desc: 'Supports vulnerable communities through redistribution of available food.' },
  { id: 2, title: 'Zero Hunger', color: '#DDA63A', desc: 'Makes surplus edible food available to people facing food insecurity.' },
  { id: 8, title: 'Decent Work & Growth', color: '#A21942', desc: 'Supports efficient resource utilization and community-based activities.' },
  { id: 12, title: 'Responsible Consumption', color: '#BF8B2E', desc: 'Addresses food-waste reduction and responsible resource use.' },
  { id: 13, title: 'Climate Action', color: '#3F7E44', desc: 'Reducing food waste helps reduce associated environmental impacts.' },
];

// Curated Unsplash food photography used for demo donations and hero imagery.
export const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80&auto=format&fit=crop',
];

export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1400&q=85&auto=format&fit=crop';