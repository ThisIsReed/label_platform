# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a bilingual (Chinese) annotation platform for AI-generated local chronicle content. Experts evaluate AI-generated content by comparing it with source materials, providing simple "good/bad" ratings and detailed text comments.

## Development Commands

### Backend (FastAPI)
```bash
# Start backend server
cd backend
python main.py

# Install dependencies
pip install -r requirements.txt

# Initialize database with test data
python init_data.py
```

### Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install

# Development server (with API proxy)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Full Stack Development
```bash
# Terminal 1: Start backend
cd backend && python main.py

# Terminal 2: Start frontend
cd frontend && npm run dev
```

## Architecture

### Backend Structure
- **FastAPI application** running on port 8001
- **SQLite database** with SQLAlchemy ORM
- **JWT authentication** with role-based access (admin/expert)
- **CORS enabled** for frontend development

**Key Models:**
- `User`: Authentication, roles (admin/expert), profile info
- `Document`: Source content vs AI-generated content pairs
- `Annotation`: User evaluations (Boolean rating + JSON comments)

**API Routes:**
- `/api/auth/*` - Authentication endpoints
- `/api/documents/*` - Document management
- `/api/annotations/*` - Annotation CRUD operations
- `/api/stats/*` - Statistics and reporting

### Frontend Structure
- **React 18** with TypeScript and Vite
- **Ant Design** UI components with Chinese locale
- **React Router** for navigation
- **Axios** for API communication

**Key Pages:**
- `/login`, `/register` - Authentication
- `/documents` - Document list view
- `/documents/:id` - Annotation interface (side-by-side comparison)
- `/stats` - Statistics dashboard

**Development Proxy:** Frontend dev server proxies `/api/*` requests to `http://localhost:8001`

### Database Schema
The system uses a simple relational model:
- Users can have multiple annotations
- Documents can have multiple annotations (one per user)
- Annotations store evaluation as Boolean and comments as JSON text

## Key Development Patterns

### Backend Patterns
- **Pydantic schemas** in `app/schemas/` for request/response validation
- **Service layer** in `app/services/` for business logic (auth, document processing)
- **Database dependency** pattern with `get_db()` function
- **JWT tokens** stored in HTTP-only cookies for security

### Frontend Patterns
- **Private routes** protected by `PrivateRoute` component
- **CSS modules** for scoped styling (`.module.css` files)
- **Chinese locale** configured throughout Ant Design
- **Responsive design** for annotation interface

### Data Flow
1. Documents contain `source_content` and `generated_content`
2. Users select text segments and add comments
3. Annotations store `evaluation` (Boolean) and `comments` (JSON array)
4. Real-time saving prevents data loss during annotation

## Default Test Data

Run `python backend/init_data.py` to create:
- **Admin user:** admin / admin123
- **Expert users:** expert1 / expert123, expert2 / expert123
- **Sample documents** about Beijing economy and Shanghai development

## Development Notes

- Backend runs on `http://localhost:8001` with auto-generated Swagger docs at `/docs`
- Frontend dev server runs on `http://localhost:5173` with API proxy
- Database file: `backend/database.db` (SQLite)
- Chinese language support throughout the application
- The platform is designed for expert evaluation of AI-generated local chronicle content
- 假定用户已经在上述地址自动了测试服务，如果测试中发现服务未启动，你需要要求用户启动