#!/bin/bash

# Create main app directories
mkdir -p src/app/about
mkdir -p src/app/api/auth
mkdir -p src/app/cart
mkdir -p src/app/contact
mkdir -p src/app/donate
mkdir -p src/app/faq
mkdir -p src/app/privacy
mkdir -p src/app/shoes
mkdir -p src/app/terms
mkdir -p src/app/get-involved
mkdir -p src/app/shipping
mkdir -p src/app/account

# Create API route directories 
mkdir -p src/app/api/donations
mkdir -p src/app/api/shoes
mkdir -p src/app/api/orders
mkdir -p src/app/api/users

# Create component directories
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/shoes
mkdir -p src/components/donate

# Create lib directories
mkdir -p src/lib/api
mkdir -p src/lib/auth
mkdir -p src/lib/db
mkdir -p src/lib/validations

# Create hook directories
mkdir -p src/hooks

# Create admin app directories
mkdir -p src/app/admin
mkdir -p src/app/admin/dashboard
mkdir -p src/app/admin/donations
mkdir -p src/app/admin/orders
mkdir -p src/app/admin/shoes
mkdir -p src/app/admin/users
mkdir -p src/app/admin/settings

# Create placeholder files to ensure Git tracks empty directories
touch src/app/about/page.tsx
touch src/app/cart/page.tsx
touch src/app/contact/page.tsx
touch src/app/donate/page.tsx
touch src/app/faq/page.tsx
touch src/app/privacy/page.tsx
touch src/app/shoes/page.tsx
touch src/app/terms/page.tsx
touch src/app/get-involved/page.tsx
touch src/app/shipping/page.tsx
touch src/app/account/page.tsx

echo "Project structure initialized!" 