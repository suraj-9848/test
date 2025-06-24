# Admin Dashboard Backend Integration

This document describes the integration between the admin dashboard frontend and the backend API.

## Overview

The admin dashboard has been fully integrated with the backend API to provide dynamic data management for:
- Organizations (CRUD operations)
- Users (College Admins, Instructors, Students)

## API Integration

### Authentication
- Uses NextAuth.js for authentication
- Sends `id_token` as Bearer token in Authorization header
- All API calls require authentication

### API Structure
All API calls are centralized in `/src/api/adminApi.ts` with proper error handling and type safety.

### Backend Routes Used

#### Organizations
- `GET /admin/get-all-org` - Fetch all organizations
- `POST /admin/create-org` - Create new organization
- `PUT /admin/update-org/:org_id` - Update organization
- `DELETE /admin/delete-org/:org_id` - Delete organization

#### Users
- `POST /admin/create-college-admin` - Create college admin
- `PUT /admin/update-college-admin/:user_id` - Update college admin
- `DELETE /admin/delete-college-admin/:user_id` - Delete college admin

- `POST /admin/create-instructor` - Create instructor
- `PUT /admin/update-instructor/:user_id` - Update instructor
- `DELETE /admin/delete-instructor/:user_id` - Delete instructor

- `POST /admin/create-student` - Create student
- `PUT /admin/update-student/:user_id` - Update student
- `DELETE /admin/delete-student/:user_id` - Delete student

## State Management

### Stores
- `/src/store/organizationStore.ts` - Manages organization state
- `/src/store/adminStore.ts` - Manages user state

### Features
- Real-time data synchronization with backend
- Loading states for better UX
- Error handling with toast notifications
- Optimistic updates for better performance

## Components

### Updated Components
- `OrganizationManagement.tsx` - Full CRUD for organizations
- `UserManagement.tsx` - Full CRUD for users
- `Toast.tsx` - Toast notification component
- `ToastContext.tsx` - Toast context provider

### Features Added
- Loading spinners during API calls
- Error handling with user-friendly messages
- Success notifications for all operations
- Disabled states during loading
- Proper form validation

## Environment Setup

Make sure to set the following environment variable:
```
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:3000
```

## Usage

1. Start the backend server
2. Start the frontend with `npm run dev`
3. Navigate to `/dashboard/admin`
4. Use the sidebar to switch between different management sections

## Error Handling

All API calls include comprehensive error handling:
- Network errors
- Authentication errors
- Validation errors
- Server errors

Errors are displayed as toast notifications to provide immediate feedback to users.

## Data Flow

1. User performs action (create, update, delete)
2. Component calls store method
3. Store calls API function
4. API function makes HTTP request to backend
5. Response is handled and state is updated
6. UI reflects changes immediately
7. Toast notification shows success/error

## Notes

- The backend was updated to include the missing `updateOrg` function and route
- All routes now use proper REST conventions with route parameters
- Authentication is handled automatically via NextAuth session
- All operations are real-time and reflect immediately in the UI 