// Common status types
export type Status = 'submitted' | 'received' | 'processed' | 'cancelled' | 'shipped' | 'delivered' | 'pending' | 'approved' | 'rejected';

// Money donation status types
export type MoneyDonationStatus = 'submitted' | 'received' | 'processed' | 'cancelled';

// Common filter parameters interface
export interface FilterParams {
  search?: string;
  status?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

// Common address type
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Common user type
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  address?: Address;
  schoolName?: string;
  grade?: string;
  sports?: string[];
  sportClub?: string;
}

// Common donation item type
export interface DonationItem {
  brand: string;
  size: string;
  condition: string;
  quantity: number;
}

// Common status badge configuration
export interface StatusConfig {
  color: string;
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Common status badge mapping
export const STATUS_CONFIGS: Record<Status, StatusConfig> = {
  submitted: {
    color: 'bg-blue-100 text-blue-800',
    text: 'Submitted'
  },
  received: {
    color: 'bg-green-100 text-green-800',
    text: 'Received'
  },
  processed: {
    color: 'bg-purple-100 text-purple-800',
    text: 'Processed'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800',
    text: 'Cancelled'
  },
  shipped: {
    color: 'bg-indigo-100 text-indigo-800',
    text: 'Shipped'
  },
  delivered: {
    color: 'bg-green-100 text-green-800',
    text: 'Delivered'
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-800',
    text: 'Pending'
  },
  approved: {
    color: 'bg-green-100 text-green-800',
    text: 'Approved'
  },
  rejected: {
    color: 'bg-red-100 text-red-800',
    text: 'Rejected'
  }
};

// Money donation status badge mapping
export const MONEY_DONATION_STATUS_CONFIGS: Record<MoneyDonationStatus, StatusConfig> = {
  submitted: {
    color: 'bg-blue-100 text-blue-800',
    text: 'Submitted'
  },
  received: {
    color: 'bg-yellow-100 text-yellow-800',
    text: 'Received'
  },
  processed: {
    color: 'bg-green-100 text-green-800',
    text: 'Processed'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800',
    text: 'Cancelled'
  }
};

// Common API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Common pagination type
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface CartItem {
  id: string;
  shoeId: number; // Sequential ID from inventory
  inventoryId: string;
  name: string;
  brand: string;
  modelName: string;
  size: string;
  color: string;
  sport: string;
  condition: string;
  gender: 'men' | 'women' | 'unisex' | 'boys' | 'girls';
  image: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface ShoeRequestItem {
  inventoryId: string;
  shoeId: number;
  brand: string;
  name: string;
  modelName?: string;
  size: string;
  color: string;
  sport: string;
  condition: string;
  gender: 'men' | 'women' | 'unisex' | 'boys' | 'girls';
  image: string;
  quantity: number;
  notes?: string;
}

export interface ShoeRequestOrder {
  id: string;
  userId: string;
  items: ShoeRequestItem[];
  status: 'submitted' | 'approved' | 'shipped' | 'rejected';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingMethod: 'standard' | 'pickup';
  shippingFee: number;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}

export enum RequestStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  SHIPPED = 'shipped',
  REJECTED = 'rejected'
}

export const REQUEST_STATUSES = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  SHIPPED: 'shipped',
  REJECTED: 'rejected'
} as const;

export type RequestUrgency = 'low' | 'medium' | 'high';

export interface RequestStatusHistory {
  status: RequestStatus;
  timestamp: string;
  note?: string;
}

export interface ShoeRequest {
  _id: string;
  requestId: string;
  orderId?: string;
  requestorInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: ShoeRequestItem[];
  statusHistory: RequestStatusHistory[];
  createdAt: string;
  updatedAt: string;
  shippingInfo?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export type OrderStatus = 'pending' | 'rejected' | 'shipped' | 'cancelled';

export const ORDER_STATUSES: Record<string, OrderStatus> = {
  PENDING: 'pending',
  REJECTED: 'rejected', 
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled'
};

export interface OrderItem {
  shoeId: number;
  shoeName: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  provider: 'stripe' | 'paypal';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  customerId?: string | null;
  customerEmail?: string | null;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingFee: number;
  totalCost: number;
  paymentInfo: PaymentInfo;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
} 
