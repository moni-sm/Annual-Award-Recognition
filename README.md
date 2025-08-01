# 🏆 Annual Award Recognition System

A comprehensive web application built with the MERN stack for managing annual employee award and recognition programs. This system streamlines the nomination process, manages employee data, and provides administrative oversight for recognition ceremonies.

> ⚠️ **Note**: This project was developed for an organization and contains proprietary code. The source code is not publicly available.

🎯 Project Overview
The Annual Award Recognition System is designed to facilitate seamless employee recognition through a digital platform. It enables organizations to conduct award ceremonies efficiently by providing separate interfaces for employees to submit nominations and administrators to manage the entire process.

🚀 Tech Stack
MERN Stack Implementation:

MongoDB - NoSQL database for storing employee data, nominations, and award categories

Express.js - Backend framework handling API routes and middleware

React.js - Frontend library for building responsive user interfaces

Node.js - Server-side JavaScript runtime environment

📋 Features
Client Interface
Division-based Employee Filtering - Filter employees and nominators by organizational divisions

Auto-fill Employee Details - Automatic population of employee information upon name selection

Dynamic Award Forms - Award-specific question forms that adapt based on selected award type

Responsive Design - Mobile-friendly interface for nominations on any device

Admin Dashboard
Comprehensive Data Management - View all submitted nomination forms and responses

Winner and Nominee Tracking - Monitor top nominees and declare winners

Advanced Filtering - Filter nominations by division, award type, and other criteria

Employee Management System - Complete CRUD operations for employee data

Add new employees

Update existing records

Delete employee entries

Nomination Management - Full control over nomination lifecycle

Server Architecture
Secured Routes - Protected API endpoints with authentication middleware

Environment Configuration - Secure credential management using .env files

RESTful API Design - Clean API structure following REST principles

🏗️ Project Structure
text
annual-award-recognition/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service calls
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication & validation
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/              # Server utilities
│   ├── .env                # Environment variables
│   └── package.json
└── README.md
🚀 Installation & Setup
Prerequisites
Node.js (v14.0.0 or higher)

MongoDB (local installation or MongoDB Atlas)

npm or yarn package manager

Backend Setup
bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file with the following variables:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# PORT=5000

# Start development server
npm run dev
Frontend Setup
bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start React development server
npm start
Database Configuration
Create a MongoDB database for the application

Configure connection string in server/.env file

The application will automatically create required collections on first run

🔧 Environment Variables
Create a .env file in the server directory:

text
MONGODB_URI=mongodb://localhost:27017/annual-awards
JWT_SECRET=your-super-secure-jwt-secret
PORT=5000
NODE_ENV=development
📊 Database Schema
Employee Model
Employee ID, Name, Email

Department, Designation, Division

Profile information and employment details

Nomination Model
Nominee and Nominator information

Award category and submission details

Division-specific data and timestamps

Form responses and supporting documents

Award Categories Model
Award types and descriptions

Category-specific question sets

Evaluation criteria and guidelines

🚦 API Endpoints
Authentication Routes
POST /api/auth/login - User authentication

POST /api/auth/register - New user registration

GET /api/auth/verify - Token verification

Employee Routes
GET /api/employees - Fetch all employees

POST /api/employees - Add new employee

PUT /api/employees/:id - Update employee

DELETE /api/employees/:id - Delete employee

GET /api/employees/division/:division - Filter by division

Nomination Routes
GET /api/nominations - Fetch all nominations

POST /api/nominations - Submit new nomination

PUT /api/nominations/:id - Update nomination

DELETE /api/nominations/:id - Delete nomination

GET /api/nominations/division/:division - Filter by division

🔒 Security Features
JWT Authentication - Secure user sessions and API access

Input Validation - Server-side validation for all form inputs

CORS Configuration - Cross-origin resource sharing setup

Environment Variables - Sensitive data protection

Route Protection - Middleware-based access control

🌐 Deployment
The application is fully deployed and production-ready with:

Frontend Deployment - Optimized React build for production

Backend Deployment - Node.js server with production configurations

Database Hosting - MongoDB Atlas cloud database

Environment Management - Production environment variables

Performance Optimization - Minified assets and efficient API calls

📝 Usage
For Employees
Login to the system using organizational credentials

Select Division to filter relevant employees and nominators

Choose Nominee - Employee details auto-populate upon selection

Select Award Type - Form adapts with category-specific questions

Submit Nomination - Complete the form and submit for review

For Administrators
Access Admin Dashboard with administrative privileges

View All Nominations - Comprehensive list of all submissions

Manage Employees - Add, update, or remove employee records

Filter and Analyze - Use division and category filters for insights

Track Winners - Monitor top nominees and manage award decisions

🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/new-feature)

Commit changes (git commit -am 'Add new feature')

Push to branch (git push origin feature/new-feature)

Create a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🆘 Support
For technical support or questions about the Annual Award Recognition System:

Create an issue in the repository

Contact the development team

Check the documentation for troubleshooting guides

Built with ❤️ using the MERN Stack

Streamlining employee recognition through modern web technology
