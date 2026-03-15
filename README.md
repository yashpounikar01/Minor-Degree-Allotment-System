# MDM Counselling System

## Overview

The MDM Counselling System is a full-stack web application designed to streamline the process of minor allotment counselling in an academic environment. It provides administrators with tools to manage student data, handle allotment sessions, perform automated allotments based on preferences, and generate exportable reports. The system consists of a Node.js backend API and a React frontend interface.

## Features

- **User Authentication**: Secure login and registration system using JWT tokens
- **CSV Data Upload**: Bulk upload student information and preferences via CSV files
- **Session Management**: Create and manage different counselling sessions
- **Automated Allotment**: Process student allotments based on predefined rules and preferences
- **Branch Management**: Handle different academic branches and their capacities
- **Export Functionality**: Generate DOCX documents using customizable templates
- **Responsive UI**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **Real-time Updates**: Dynamic session and allotment status tracking

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database for storing student data, sessions, and allotment results
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **multer** - File upload handling
- **csv-parser** - CSV file processing
- **docxtemplater** - DOCX document generation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **ESLint** - Code linting

## Project Structure

```
MDM_Counselling/
├── backend/                          # Node.js backend
│   ├── app.js                        # Main application file
│   ├── package.json                  # Backend dependencies
│   ├── controllers/                  # Business logic controllers
│   │   └── allotmentController.js
│   ├── db/                           # Database configuration
│   │   ├── connection.js
│   │   └── db.txt
│   ├── middleware/                   # Custom middleware
│   │   └── authMiddleware.js
│   ├── routes/                       # API route handlers
│   │   ├── allotment.js
│   │   ├── auth.js
│   │   ├── export-template.js
│   │   ├── export.js
│   │   ├── sessions.js
│   │   └── upload.js
│   ├── templates/                    # DOCX templates
│   └── uploads/                      # File upload directory
│       └── students.csv              # Sample CSV file
└── minor-allotment-frontend/         # React frontend
    ├── package.json                  # Frontend dependencies
    ├── vite.config.js                # Vite configuration
    ├── index.html                    # HTML entry point
    ├── src/
    │   ├── App.jsx                  # Main React component
    │   ├── main.jsx                 # React entry point
    │   ├── api.js                   # API client functions
    │   ├── auth.js                  # Authentication utilities
    │   ├── components/               # React components
    │   │   ├── AllotmentResult.jsx
    │   │   ├── BranchManager.jsx
    │   │   ├── CSVUpload.jsx
    │   │   ├── ExportButton.jsx
    │   │   ├── LoginRegister.jsx
    │   │   ├── SessionManager.jsx
    │   │   ├── StudentSearch.jsx
    │   │   └── auth/
    │   │       ├── Login.jsx
    │   │       └── Register.jsx
    │   └── assets/                   # Static assets
    └── public/                       # Public assets
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory with the following environment variables:
   ```
   PORT=5000
   ADMIN_SECRET_CODE=your_secret_code
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=minor_allotment
   JWT_SECRET=your_jwt_secret
   ```

4. Set up the MySQL database:
   - Run the SQL script from `backend/db/db.txt` to create the database and tables:
   ```bash
   mysql -u your_db_user -p < backend/db/db.txt
   ```
   - Or import it manually through MySQL client with the schemas provided in `db.txt`

5. Start the backend server:
   ```bash
   node app.js
   ```

### Frontend Setup
1. Navigate to the `minor-allotment-frontend` directory:
   ```bash
   cd minor-allotment-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` (default Vite port).

## Usage

1. **Registration/Login**: New users can register, existing users can log in using the authentication interface.

2. **Session Management**: Create new counselling sessions with specific dates and parameters.

3. **Data Upload**: Upload CSV files containing student information and their minor preferences.

4. **Allotment Processing**: Run the allotment algorithm to assign minors based on student preferences and branch capacities.

5. **View Results**: Check allotment results and student assignments.

6. **Export**: Generate and download DOCX reports using predefined templates.

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### File Upload
- `POST /upload` - Upload CSV files

### Allotment
- `POST /allot` - Process allotment
- `GET /allot/results` - Get allotment results

### Sessions
- `GET /sessions` - Get all sessions
- `POST /sessions` - Create new session
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session

### Export
- `GET /export/template` - Download export template
- `POST /export/generate` - Generate DOCX report

## Database Schema

The application uses the following MySQL database tables:

### admins
Stores admin user credentials
- `id` (INT, PK) - Admin ID
- `username` (VARCHAR) - Unique username
- `password` (VARCHAR) - Hashed password
- `created_at` (TIMESTAMP) - Account creation timestamp

### sessions
Manages different counselling sessions
- `id` (INT, PK) - Session ID
- `session_name` (VARCHAR) - Unique session name
- `created_at` (TIMESTAMP) - Creation timestamp
- `is_active` (TINYINT) - Boolean flag for active session

### students
Stores student information and preferences
- `id` (INT, PK) - Student ID
- `session_id` (INT, FK) - References sessions.id
- `erpid` (VARCHAR) - Student ERP ID
- `name` (VARCHAR) - Student name
- `branch` (VARCHAR) - Home branch
- `obtainedmarks_1` (FLOAT) - Marks obtained in sem 1
- `totalmarks_1` (FLOAT) - Total marks sem 1
- `obtainedmarks_2` (FLOAT) - Marks obtained in sem 2
- `totalmarks_2` (FLOAT) - Total marks sem 2
- `avg_percent` (FLOAT) - Average percentage
- `pref_1` to `pref_5` (VARCHAR) - Minor preferences (1st to 5th choice)

### branches
Tracks branch capacity and allotments
- `id` (INT, PK) - Branch ID
- `session_id` (INT, FK) - References sessions.id
- `branch_name` (VARCHAR) - Name of the branch
- `total_seats` (INT) - Total available seats (default: 72)
- `allotted_seats` (INT) - Seats already allotted

### allotments
Stores the final allotment results
- `id` (INT, PK) - Allotment ID
- `session_id` (INT, FK) - References sessions.id
- `erpid` (VARCHAR) - Student ERP ID
- `allotted_branch` (VARCHAR) - Assigned branch
- `rank` (INT) - Rank/priority in allotment

## Development

### Running Tests
- Backend: `npm test` (currently no tests configured)
- Frontend: `npm run lint` for ESLint checks

### Building for Production
1. Backend: No build step required for Node.js
2. Frontend:
   ```bash
   npm run build
   ```

### Environment Variables
Ensure all required environment variables are set in the `.env` file for both backend and frontend.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please open an issue in the GitHub repository or contact the development team.