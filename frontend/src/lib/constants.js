// Shared Nigerian domain constants used across the UI.

export const APP_NAME = 'FarmConnect NG'
export const APP_TAGLINE = 'Connecting Nigerian farmers directly to buyers'

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
]

export const PRODUCT_CATEGORIES = [
  'Grains & Cereals',
  'Tubers & Roots',
  'Vegetables',
  'Fruits',
  'Legumes & Nuts',
  'Livestock & Poultry',
  'Dairy & Eggs',
  'Cash Crops',
  'Others',
]

export const PRODUCT_UNITS = ['kg', 'bag', 'tonne', 'basket', 'bunch', 'tuber', 'piece', 'crate', 'jerrycan', 'litre']

export const ORDER_STATUS = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted: { label: 'Accepted', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  processing: { label: 'Processing', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
}

export const ORDER_FLOW = ['pending', 'accepted', 'processing', 'shipped', 'delivered']

// Approximate centre of Nigeria for map defaults.
export const NIGERIA_CENTER = [9.082, 8.6753]
export const NIGERIA_ZOOM = 6
