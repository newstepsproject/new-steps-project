# New Steps Project - Database Schema

## User Collection

```typescript
interface User {
  _id: ObjectId;
  email: string;
  password?: string; // Hashed
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Optional fields
  schoolName?: string;
  grade?: string;
  sport?: string;
  sportClub?: string;
  // OAuth related
  googleId?: string;
  emailVerified: boolean;
  // System fields
  role: "user" | "admin" | "superadmin";
  createdAt: Date;
  updatedAt: Date;
  // References
  orders: ObjectId[]; // Reference to Order collection
  donations: ObjectId[]; // Reference to Donation collection
}
```

## Shoe Collection

```typescript
interface Shoe {
  _id: ObjectId;
  uniqueId: string; // Custom ID format
  sport: string;
  brand: string;
  size: string;
  color: string;
  condition: "like_new" | "very_good" | "good" | "acceptable";
  description: string;
  photos: {
    url: string;
    thumbnailUrl: string;
    order: number; // 0-3 for up to 4 photos
  }[];
  status: "available" | "requested" | "shipped" | "donated" | "unavailable";
  inventoryCount: number;
  createdAt: Date;
  updatedAt: Date;
  // References
  donationId?: ObjectId; // Reference to Donation that provided this shoe
  orders?: ObjectId[]; // Orders that include this shoe
}
```

## Order Collection

```typescript
interface Order {
  _id: ObjectId;
  orderId: string; // Generated from shoe ID
  userId: ObjectId; // Reference to User collection
  items: {
    shoeId: ObjectId;
    shoeName: string; // Denormalized for quick access
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingFee: number;
  totalCost: number;
  paymentInfo: {
    provider: "stripe" | "paypal";
    transactionId: string;
    status: "pending" | "completed" | "failed";
  };
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "requested_return" | "return_received";
  statusHistory: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Donation Collection

```typescript
interface Donation {
  _id: ObjectId;
  donationId: string;
  userId: ObjectId; // Reference to User collection
  type: "shoes" | "money";
  
  // For shoe donations
  shoes?: {
    sport: string;
    brand: string;
    size: string;
    color: string;
    condition: "like_new" | "very_good" | "good" | "acceptable";
    description?: string;
  }[];
  
  // For money donations
  amount?: number;
  checkNumber?: string;
  
  // Contact & logistics
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isBayArea: boolean;
  pickupDetails?: {
    preferredDate: Date;
    preferredTimeSlot: string;
    location: string;
    instructions?: string;
  };
  
  // Status tracking
  status: "submitted" | "confirmed" | "completed";
  statusHistory: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
  
  // References to shoes created from this donation
  resultingShoes?: ObjectId[];
}
```

## Operator Collection

```typescript
interface Operator {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string;
  role: "manager" | "volunteer" | "admin";
  photo?: string;
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Settings Collection

```typescript
interface Settings {
  _id: ObjectId;
  key: string; // e.g., "shipping_fee", "office_address"
  value: any;
  lastUpdated: Date;
  updatedBy: ObjectId; // Reference to Operator who updated it
}
``` 