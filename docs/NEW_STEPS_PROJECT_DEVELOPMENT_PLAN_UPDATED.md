# New Steps Project - Updated Comprehensive Development Plan

## Project Overview
The New Steps Project is a platform that facilitates the donation and redistribution of used sports shoes. People can donate shoes they no longer use, and others (particularly young athletes) can request these shoes for free, paying only for shipping if needed. This non-profit initiative aims to reduce waste, support young athletes, raise recycling awareness, and strengthen local communities.

## Development Phases

### Phase 1: Project Setup and Infrastructure (Weeks 1-2)
- **Domain Registration and AWS Setup**
  - Register domains: newsteps.fit and admin.newsteps.fit
  - Set up AWS hosting environment
  - Configure DNS settings and SSL certificates
  
- **Development Environment Setup**
  - Initialize Next.js project with TypeScript
  - Set up MongoDB database and connection
  - Configure Tailwind CSS and shadcn/ui component library
  - Create GitHub repository with branching strategy
  - Establish CI/CD pipeline with GitHub Actions
  
- **Authentication System**
  - Implement email/password authentication with minimum 8-character password requirement
  - Add Google OAuth integration
  - Create email verification system with verification codes
  - Build password management (reset, change)
  - Implement secure session handling
  - Set up password encryption with salt and hash functions

- **Email Communication System**
  - Set up email service integration (Amazon SES or SendGrid)
  - Create email template system for various notifications
  - Implement triggered email workflows
  - Set up email delivery tracking and analytics

### Phase 2: Core Features - Public Website (Weeks 3-6)
- **About Us Page**
  - Project mission and values section
  - Team introduction with photos and bios (pre-populated with Walter Zhang's info)
  - Platform operation explanation
  - FAQ section

- **User Profile Management**
  - Registration form with required fields (name, email, phone, address, etc.)
  - Optional fields (school name, grade, sport, sport club name)
  - Profile editing interface
  - User data validation
  - Account deletion functionality
  - Profile image upload

- **Donation System**
  - **Shoe Donation Module:**
    - Donation form with standardized condition assessment criteria
    - Address detection/validation system to identify Bay Area donors
    - Bay Area pickup scheduling interface
    - Shipping instructions for non-Bay Area donors
    - Email confirmation workflow
    - Donation status tracking (submitted, confirmed, completed)
    
  - **Money Donation Module:**
    - Interface explaining check-based donation process
    - Form to collect donor information and donation amount
    - Check mailing instructions with pre-populated project address and manager name
    - Check tracking and reconciliation system
    - Email confirmation workflow
    - Donation history for logged-in users
    - Receipt generation for tax purposes

- **Request Shoes System**
  - **Shoe Catalog Module:**
    - Shoe listing with filtering and search (by sport, brand, size, color)
    - Pagination system for shoe listings
    - Sort functionality by different criteria
    - Automated visibility control based on inventory (hide zero inventory items)
    - Shoe detail pages with:
      - Up to 4 photos with thumbnails and full-size view options
      - Detailed descriptions (sport, brand, size, color, quality, status)
      - Unique ID and URL generation system
  
  - **Shopping Cart Module:**
    - Add to cart functionality
    - Cart management (view, edit, remove items)
    - Login/registration requirement before checkout
  
  - **Checkout Module:**
    - Shipping details form with address saving
    - Integration with payment processor for shipping fees ($5 default)
    - Order summary with total cost calculation
    - Order confirmation with success message
    - Redirect to order history after checkout
    - Order confirmation emails
    - Receipt generation

  - **Order History Module:**
    - Order listing with status tracking
    - Order details view
    - Order status updates

- **Get Involved Page**
  - Volunteer recruitment information
  - Contact form for inquiries
  - Success message after form submission
  - Email notification system for inquiries

### Phase 3: Admin Dashboard (Weeks 7-9)
- **Admin Authentication**
  - Secure login system for admin.newsteps.fit
  - Role-based access control

- **Dashboard Overview**
  - Key metrics visualization (shoes, orders, donations, users)
  - Summary statistics
  - Recent activity feed
  
- **Orders Management**
  - Order listing with search/filter
  - Order status management with specific statuses:
    - Pending
    - Confirmed
    - Shipped
    - Delivered
    - Cancelled
    - Requested Return
    - Return Received
  - Order details view
  - Order update notifications
  - Returns processing workflow

- **Donations Management**
  - Donation listing with search/filter
  - Donation status management:
    - Pending
    - Confirmed
    - Received
  - Donation details view
  - Donor communication tools
  - Separate handling for shoe and money donations

- **Users Management**
  - User listing with search capabilities
  - User profile editing
  - Account management tools
  - Activity history

- **Shoe Inventory Management**
  - Inventory listing with search/filter by multiple criteria:
    - Sport name
    - Brand name
    - Description
    - Size
    - Color
    - Inventory count
  - Inventory counts displayed in badges
  - Add/edit shoe details with multiple photo upload (up to 4)
  - Inventory count tracking
  - Automatic visibility control based on inventory
  - Bulk operations for efficiency

- **Settings Management**
  - Operator management (add/edit/delete)
  - Project details configuration
  - Shipping fee settings (default: $5)
  - Email template management
  - System initialization with pre-populated values:
    - Project office address: 348 Cardona Cir, San Ramon, CA 94583, USA
    - Project manager's name: Walter Zhang
    - Project manager's email: walterzhang10@gmail.com
    - Project manager's phone: (916) 582-7090

### Phase 4: Testing and Refinement (Weeks 10-11)
- **Comprehensive Testing**
  - Unit testing for all components
  - Integration testing
  - User acceptance testing
  - Mobile responsiveness testing
  - Performance testing
  - Security testing with focus on payment and user data
  - Cross-browser compatibility testing

- **UX Refinement**
  - Gather feedback from test users
  - Optimize user flows
  - Improve mobile experience
  - Ensure accessibility standards (WCAG compliance)
  - Performance optimization
  - Consistency review of success messages and user feedback

### Phase 5: Deployment and Launch (Week 12)
- **Final Deployment**
  - Finalize production environment
  - Complete security audit
  - Deploy to production servers
  - Configure monitoring systems
  - Database seeding with default values

- **Launch Preparation**
  - Create documentation for operators
  - Prepare initial content
  - Set up analytics
  - Backup strategies
  - Standard operating procedures for donation processing

- **Official Launch**
  - Go-live for public website
  - Go-live for admin dashboard
  - Launch announcement

## Technical Stack

### Frontend
- **Framework**: React.js with Next.js
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context and React Query
- **Form Handling**: React Hook Form with Zod validation
- **Image Handling**: AWS S3 with image optimization

### Backend
- **Framework**: Next.js API routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3
- **Email Service**: Amazon SES or SendGrid
- **Payment Processing**: Stripe or PayPal

### DevOps
- **Hosting**: AWS (EC2, ECS, or Lambda)
- **CI/CD**: GitHub Actions
- **Database Hosting**: MongoDB Atlas
- **Monitoring**: AWS CloudWatch
- **Version Control**: Git with GitHub
- **SSL**: Let's Encrypt

### Testing
- **Unit Testing**: Jest and React Testing Library
- **End-to-End Testing**: Cypress
- **Performance Testing**: Lighthouse
- **Accessibility Testing**: axe-core
- **Security Testing**: OWASP tools

## Database Schema (High-Level)

1. **Users**
   - Personal information (name, email, phone, address)
   - Authentication details
   - Profile preferences
   - Optional details (school, grade, sports played, sport club)
   - Account creation and update timestamps

2. **Shoes**
   - Unique ID and URL
   - Details (sport, brand, size, color, condition)
   - Photos (up to 4 per shoe)
   - Status (available, requested, shipped)
   - Inventory count
   - Creation and update timestamps

3. **Orders**
   - Order ID (derived from shoe ID)
   - User reference
   - Shoes included
   - Shipping details
   - Status tracking with specific statuses
   - Payment information
   - Timestamps for status changes

4. **Donations**
   - Donor information
   - Donation type (shoes/money)
   - Shoe details if applicable
   - Address information for pickup/shipping logistics
   - Bay Area flag for special handling
   - Status with tracking
   - Timestamps

5. **Operators**
   - Personal information
   - Role
   - Bio and photo
   - Contact information
   - Access level

6. **Settings**
   - Project details
   - Default shipping fee
   - Office address
   - Contact information

## Post-Launch Considerations

### Analytics and Monitoring
- Implement Google Analytics for user behavior
- Set up error tracking with Sentry
- Monitor performance metrics
- Regular security scanning
- Email delivery and open rate tracking

### Continuous Improvement
- Regular user feedback collection
- Feature prioritization framework
- Quarterly review and planning cycles
- A/B testing for optimizations
- Donation and distribution metrics analysis

### Scalability Planning
- Database indexing and optimization
- Image compression and CDN implementation
- Caching strategies
- Server scaling approach
- Backup and disaster recovery planning

## Time and Resource Estimates

- **Total Timeline**: 12 weeks
- **Team Composition**:
  - 1 Project Manager
  - 2 Full-stack Developers
  - 1 UI/UX Designer
  - 1 QA Tester (part-time)

- **Key Milestones**:
  - End of Week 2: Infrastructure and email system complete
  - End of Week 6: Public website features complete
  - End of Week 9: Admin dashboard complete
  - End of Week 11: Testing complete
  - End of Week 12: Launch

This updated development plan provides a detailed approach to building the New Steps Project, addressing all specific requirements from the project description. The enhanced plan ensures all aspects of donation logistics, payment processing, email communications, and specific UI/UX elements are properly accounted for, creating a seamless experience for donors and recipients while giving administrators powerful tools to manage the platform. 