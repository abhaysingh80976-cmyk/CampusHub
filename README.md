# CampusHub

Full-stack Campus Portal built with **React (Vite)**, **Node.js / Express**, **Firebase Authentication**, and **Cloud Firestore**.

## Live Links
- **Frontend Web App:** https://campushub-web-alpha.vercel.app
- **Backend API:** https://campushub-api-jade.vercel.app
- **GitHub Repository:** https://github.com/abhaysingh80976-cmyk/CampusHub

## Key Features
- Open registration for students/teachers via public link
- Role-based dashboards (Student, Teacher, Admin)
- Firebase Authentication & Firestore database integration
- Admin seeding via CLI script (`backend/scripts/seedAdmin.js`)

## Local Setup & Admin Seed
1. Install dependencies in `backend` and `frontend`.
2. Configure `.env` files locally (do not commit secrets).
3. Seed an admin user:
   ```bash
   cd backend
   node scripts/seedAdmin.js <admin-email> <strong-password> "Admin Name"
   ```
