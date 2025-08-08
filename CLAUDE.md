# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Headless UI, React Hot Toast
- **Date Handling**: date-fns with timezone support
- **PDF Generation**: pdf-lib

## Application Architecture

### Core Entities and Relationships

This is a tutoring management application with the following core entities:

- **Profiles**: User accounts with roles (Admin, Staff, Coordinator, Tutor, Tutee)
- **Groups**: User categories (LES, UES, MHS, ADMIN)
- **Sessions**: Tutoring sessions with location, date, hours, and status
- **Pairs**: Tutor-Tutee relationships (one-to-many from tutor perspective)
- **Attendances**: Session attendance tracking (Present, Excused, Absent)
- **Payments**: Payment records with multiple methods (Cash, Paypal, Venmo, Zelle)
- **Contents**: Editable content management system

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - `(auth)/` - Authentication pages (login, register, password reset)
  - `(protected)/` - Role-protected pages (attendances, payments, sessions, users)
  - `api/` - API routes for backend functionality
  - `components/` - Reusable React components
- `lib/` - Shared utilities and configurations
  - `supabase.ts` - Database client and auth helpers
  - `auth.ts` - Authentication functions
  - `roles.ts` - Role-based access control
- `types/` - TypeScript type definitions
  - `database/schema.ts` - Database schema types and enums
- `utils/` - Utility functions and tools
  - `ssl-generator/` - SSL certificate generation utilities

### Authentication & Authorization

- Uses Supabase Auth with email/password authentication
- Middleware-based route protection for `/profile`, `/applications`, `/pairs`, `/sessions`
- Role-based access control:
  - Admin/Staff/Coordinator: Access to management features
  - Tutor: Access to paired tutees and sessions
  - Tutee: Access to paired tutor information
- Profile creation happens automatically on first login

### Key Features

- **Session Management**: Create and track tutoring sessions with attendance
- **Pair Management**: Assign tutors to tutees (one tutor can have multiple tutees)
- **Payment Tracking**: Record payments with various methods
- **Attendance Analytics**: Track and analyze attendance patterns
- **SSL Certificate Generation**: Generate SSL learning certificates
- **User Export**: Export user data functionality
- **Application System**: Handle role applications and approvals

### Database Patterns

- All database operations use the typed Supabase client
- Profile enrichment includes pairing information based on user role
- Attendance tracking is session-based with enum types for status
- Uses Supabase RLS (Row Level Security) for data access control

### Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL` - Application base URL for redirects