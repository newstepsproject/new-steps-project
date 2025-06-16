# New Steps Project Structure

## Directory Structure

```
newsteps-project/
├── .github/                    # GitHub Actions workflows
│   └── workflows/  
│       ├── ci.yml              # Continuous Integration workflow
│       └── deploy.yml          # Deployment workflow
├── public/                     # Static assets
│   ├── images/                 # Static images
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public routes
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── about/
│   │   │   ├── donate/
│   │   │   ├── request/
│   │   │   ├── get-involved/
│   │   │   └── profile/
│   │   ├── (admin)/            # Admin routes
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   ├── donations/
│   │   │   ├── users/
│   │   │   ├── shoes/
│   │   │   └── settings/
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── shoes/
│   │   │   ├── orders/
│   │   │   ├── donations/
│   │   │   └── upload/
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── ui/                 # UI components (shadcn/ui)
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   ├── shoes/              # Shoe-related components
│   │   ├── donations/          # Donation-related components
│   │   ├── orders/             # Order-related components
│   │   └── admin/              # Admin-specific components
│   ├── constants/              # Application constants
│   │   └── config.ts
│   ├── lib/                    # Utility functions
│   │   ├── db.ts               # Database connection
│   │   ├── auth.ts             # Authentication utilities
│   │   ├── s3.ts               # S3/CloudFront utilities
│   │   └── email.ts            # Email utilities
│   ├── models/                 # MongoDB schemas
│   │   ├── user.ts
│   │   ├── shoe.ts
│   │   ├── order.ts
│   │   ├── donation.ts
│   │   └── operator.ts
│   ├── providers/              # Context providers
│   │   ├── auth-provider.tsx
│   │   └── cart-provider.tsx
│   ├── services/               # Service classes
│   │   ├── user-service.ts
│   │   ├── shoe-service.ts
│   │   ├── order-service.ts
│   │   ├── donation-service.ts
│   │   └── email-service.ts
│   ├── types/                  # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── shoe.ts
│   │   ├── order.ts
│   │   └── donation.ts
│   └── utils/                  # Helper utilities
│       ├── form-validators.ts
│       ├── formatters.ts
│       └── address-validator.ts
├── .env                        # Environment variables (not in git)
├── .env.example                # Example environment variables
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore file
├── .prettierrc                 # Prettier configuration
├── aws-config.md               # AWS configuration documentation
├── deployment-config.md        # Deployment configuration
├── jest.config.js              # Jest configuration
├── mongodb-config.md           # MongoDB configuration
├── next.config.js              # Next.js configuration
├── package.json                # Project dependencies
├── README.md                   # Project documentation
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Key Files and Components

### Database Models

#### User Model
- Personal information (name, email, phone, address)
- Authentication details
- Profile preferences and optional details
- Donation and order history references

#### Shoe Model
- Unique ID and URL
- Details (sport, brand, size, color, condition)
- Photo references
- Inventory status
- Related donations

#### Order Model
- Order ID derived from shoe ID
- User reference
- Items (shoes) included
- Shipping details
- Payment information
- Status tracking with timestamps

#### Donation Model
- Donor information
- Type (shoes/money)
- Shoe details for shoe donations
- Address for pickup/shipping logistics
- Bay Area flag and status tracking 