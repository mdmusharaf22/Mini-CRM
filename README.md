# Mini CRM - MERN Stack Application

A full-stack Customer Relationship Management (CRM) system built with MongoDB, Express.js, React, and Node.js.

## 📚 Documentation

- **[AUTHORIZATION.md](./AUTHORIZATION.md)** - Comprehensive authorization logic explanation
- **[AUTHORIZATION_SUMMARY.md](./AUTHORIZATION_SUMMARY.md)** - Simple authorization explanation
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[SUBMISSION_NOTES.md](./SUBMISSION_NOTES.md)** - Complete submission summary

---

## Features

### Authentication
- JWT-based authentication (Access Token)
- User login and registration
- Password hashing with bcrypt
- Protected routes

### Dashboard
- Total Leads count
- Qualified Leads count
- Tasks Due Today count
- Completed Tasks count

### Leads Module
- Create, Read, Update, Delete leads
- Search leads by name or email
- Filter leads by status
- Pagination support
- Soft delete (deleted leads don't appear in queries)
- Status management (New, Contacted, Qualified, Lost, Won)
- Assign leads to users
- Associate leads with companies

### Companies Module
- Create, Read, Update, Delete companies
- View company details
- View all leads associated with a company
- Search companies
- Pagination support
- Soft delete

### Tasks Module
- Create, Read, Update, Delete tasks
- Assign tasks to users
- Update task status
- Filter tasks by status
- Only assigned users can update task status
- Priority levels (Low, Medium, High)
- Due date tracking with overdue indicators
- Link tasks to leads

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

## Project Structure

```
mini-crm/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── leadController.js
│   │   │   ├── companyController.js
│   │   │   ├── taskController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Lead.js
│   │   │   ├── Company.js
│   │   │   └── Task.js
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       ├── leadRoutes.js
│   │       ├── companyRoutes.js
│   │       ├── taskRoutes.js
│   │       └── dashboardRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LeadsList.jsx
│   │   │   ├── LeadForm.jsx
│   │   │   ├── CompaniesList.jsx
│   │   │   ├── CompanyDetail.jsx
│   │   │   └── TasksList.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/mini_crm
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/users` - Get all users (protected)

### Leads
- `GET /api/leads` - Get all leads with pagination, search, filter (protected)
- `GET /api/leads/:id` - Get single lead (protected)
- `POST /api/leads` - Create new lead (protected)
- `PUT /api/leads/:id` - Update lead (protected)
- `PATCH /api/leads/:id/status` - Update lead status (protected)
- `DELETE /api/leads/:id` - Soft delete lead (protected)

### Companies
- `GET /api/companies` - Get all companies with pagination, search (protected)
- `GET /api/companies/:id` - Get single company (protected)
- `GET /api/companies/:id/leads` - Get company with associated leads (protected)
- `POST /api/companies` - Create new company (protected)
- `PUT /api/companies/:id` - Update company (protected)
- `DELETE /api/companies/:id` - Soft delete company (protected)

### Tasks
- `GET /api/tasks` - Get all tasks with pagination, filter (protected)
- `GET /api/tasks/:id` - Get single task (protected)
- `GET /api/tasks/my-tasks` - Get current user's tasks (protected)
- `POST /api/tasks` - Create new task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `PATCH /api/tasks/:id/status` - Update task status (protected, only assigned user)
- `DELETE /api/tasks/:id` - Soft delete task (protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (protected)
- `GET /api/dashboard/my-stats` - Get user-specific statistics (protected)

## Default User Credentials

After starting the application, you can register a new user through the UI:

### Register via UI (Recommended)
1. Navigate to http://localhost:5173
2. You'll see the login page with a "Sign up here" link
3. Click "Sign up here" to go to the registration page
4. Fill in your details (name, email, password)
5. Click "Sign Up" to create your account
6. You'll be automatically logged in and redirected to the dashboard

### Register via API (Alternative)
You can also register a user directly using the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

## Features Implementation

### Authorization & Security
The application implements a robust multi-layered authorization system:

#### 1. Authentication Layer
- JWT-based token authentication
- Tokens contain user ID and expire after 24 hours
- All API routes protected by `protect` middleware
- Middleware verifies token, loads user, and checks if account is active

#### 2. Data Isolation Layer
- **Leads**: Users only see leads they created (`createdBy` filter)
- **Companies**: Users only see companies they created
- **Tasks**: Users see tasks they created OR tasks assigned to them (collaborative)
- **Dashboard**: Statistics calculated only from user's own data

#### 3. Resource Ownership
Every query automatically filters by the logged-in user:
```javascript
// Example: Getting leads
const leads = await Lead.find({
  isDeleted: false,
  createdBy: req.user._id  // Only user's own leads
});
```

#### 4. Task Collaboration
Tasks support a collaborative model:
- Task creator can view, update, and delete the task
- Assigned user can view and update task status
- Both parties have appropriate access without compromising security

#### Benefits
- ✅ Complete data privacy between users
- ✅ No unauthorized access even with valid IDs
- ✅ Multi-tenant architecture ready
- ✅ Audit trail with `createdBy` tracking

### Soft Delete
All modules (Leads, Companies, Tasks) implement soft delete:
- Deleted records have `isDeleted: true`
- All queries automatically filter out soft-deleted records
- Data remains in database for audit purposes

### Authentication & Authorization
- JWT tokens expire after 24 hours
- Protected routes require valid token in Authorization header
- **Multi-tenant data isolation**: Each user only sees their own data
- **Resource ownership**: All leads, companies, and tasks are filtered by `createdBy`
- **Task collaboration**: Tasks are visible to both creator and assigned user
- **Secure by design**: Cannot access other users' data even with valid IDs

### Pagination
- All list endpoints support pagination
- Configurable page size
- Returns total count and page information

### Search & Filter
- Leads: Search by name/email, filter by status/assigned user
- Companies: Search by name/industry/location
- Tasks: Filter by status/assigned user/lead

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## License

This project is for interview/assignment purposes.

## Author

Mohamed Musharaf
