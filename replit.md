# Overview

Kaiveni is a Maldives-only partner finder web application designed exclusively for Maldivians. The application features a mobile-first PWA design with pastel theming, dark/light mode support, and a coin-based economy where users purchase coins through bank transfer with slip uploads for admin verification. The platform includes user profiles with location-based filtering (islands/atolls), post creation for partner seeking, connection requests, comprehensive admin approval workflows, and real-time 1-to-1 chat system with full administrative oversight.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Styling**: TailwindCSS with custom Maldivian pastel color palette (mint, blush, lavender, soft-blue)
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **State Management**: TanStack Query for server state, React Context for auth and theme
- **PWA Features**: Service worker, manifest.json, offline support, and mobile-first responsive design
- **File Uploads**: Uppy.js integration with Google Cloud Storage via replit sidecar
- **Mobile Optimization**: Responsive admin interface with horizontal scrolling tabs and pagination system

## Backend Architecture
- **Runtime**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with Passport.js using local strategy and scrypt password hashing
- **File Storage**: Google Cloud Storage through replit sidecar with custom ACL system
- **API Design**: RESTful JSON APIs with CORS configuration and comprehensive error handling
- **Real-time Communication**: WebSocket server for instant messaging with admin monitoring capabilities

## Database Schema Design
- **Users**: Comprehensive profile data including Maldivian-specific fields (island, atoll), status approval workflow, role-based access control, and coin balance tracking
- **Posts**: User-generated partner-seeking posts with admin approval workflow and preference matching
- **Connection Requests**: User-to-user connection system with admin oversight and coin-based pricing
- **Coin System**: Financial transactions through bank transfers with slip upload verification and ledger tracking
- **Admin Workflows**: Separate queues for user approvals, post moderation, and financial verification
- **Chat System**: Real-time messaging with conversations, participants, and message tracking for admin oversight

## Authentication & Authorization
- **Session Management**: Express-session with memory store and secure cookie configuration
- **Role-Based Access**: Multi-tier system (USER, ADMIN, SUPERADMIN) with protected routes
- **Security**: CSRF protection, password hashing with scrypt, and input validation with Zod schemas

## Geographic Data Integration
- **Maldivian Context**: Complete atoll and island data structure for location-based matching
- **Validation**: Server-side validation ensuring users can only select valid Maldivian locations
- **Filtering**: Location-based partner search and preference matching

# External Dependencies

## Cloud Infrastructure
- **Replit Hosting**: Primary deployment platform with integrated database and storage
- **Google Cloud Storage**: File storage service accessed through replit sidecar for security
- **Neon Database**: PostgreSQL database service with connection pooling

## Frontend Libraries
- **Radix UI**: Headless component primitives for accessibility and customization
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form validation and management with Zod schema integration
- **Wouter**: Lightweight client-side routing
- **Uppy**: File upload handling with cloud storage integration

## Backend Services
- **Multer**: Multipart form data handling for file uploads
- **Passport.js**: Authentication middleware with local strategy
- **Drizzle**: Type-safe ORM with automatic migration generation
- **Express Session**: Session management with configurable storage backends

## Development Tools
- **Vite**: Frontend build tool with HMR and TypeScript support
- **ESBuild**: Backend TypeScript compilation for production builds
- **Tailwind CSS**: Utility-first styling with custom design system
- **TypeScript**: End-to-end type safety across full stack