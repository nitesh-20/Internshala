<div align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

<h1 align="center">InternArea – Internship & Job Portal</h1>

<p align="center">
  <strong>A comprehensive, full-stack platform inspired by Internshala, built for educational purposes.</strong>
</p>

## 📖 Project Overview

**InternArea** is a modern internship and job portal application that connects students and job seekers with potential employers. Developed primarily for educational purposes, it mimics the core functionalities of industry-standard job portals like Internshala. 

The platform supports a robust authentication system with advanced security (OTP verification, mobile restrictions), a multi-language experience across 6 languages, premium resume building, a community networking space, and secure payment integrations.

## ✨ Features

- **🌐 Multi-language Support:** Instantly switch between English, Hindi, Spanish, Portuguese, Chinese, and French without refreshing the page.
- **🛡️ Advanced Authentication:**
  - Firebase Authentication (Google, Email/Password, Phone OTP)
  - OTP verification required for login attempts via Chrome browser.
  - Mobile login time restrictions for enhanced security.
  - Secure Forgot Password functionality.
  - Login history tracking and activity logs.
- **📄 Premium Resume Builder:** Generate and export professional PDF resumes seamlessly.
- **💳 Payment Integration:** Fully integrated with Razorpay for premium subscription plans.
- **💬 Community/Public Space:** A social networking hub to create posts, like, share, comment, and connect with peers.
- **📊 Profile Dashboard:** A centralized space to manage user details, applications, and saved opportunities.
- **🔍 Advanced Search & Filters:** Browse and filter internships and jobs based on categories, locations, and preferences.
- **📝 Internship & Job Application Tracking:** Apply to jobs and easily track the status of all applications.
- **📱 Responsive UI:** Fully mobile-friendly and aesthetic interface built with Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **Next.js** (React Framework)
- **React.js**
- **TypeScript**
- **Tailwind CSS** (Styling)
- **i18next** (Internationalization)

### Backend
- **Node.js & Express.js**
- **MongoDB** (Mongoose ODM)
- **Firebase Authentication**
- **Razorpay** (Payments)
- **Nodemailer** (Email Services for OTP & Notifications)

## 📁 Project Structure

```
internshala-Nit/
├── backend/            # Express.js backend API
│   ├── Routes/         # API Route controllers (auth, jobs, community, etc.)
│   ├── Models/         # Mongoose schemas
│   ├── index.js        # Server entry point
│   └── db.js           # MongoDB connection setup
│
└── internarea/         # Next.js frontend application
    ├── src/
    │   ├── Components/ # Reusable React components (Navbar, Modals, Forms)
    │   ├── pages/      # Next.js page routes (Home, Profile, Community, Jobs)
    │   ├── locales/    # Translation files for i18n support
    │   └── utils/      # Helper functions and hooks
    ├── public/         # Static assets
    └── next.config.ts  # Next.js configuration
```

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/nitesh-20/Internshala.git
cd Internshala
```

### 2. Configure Environment Variables
You will need to create two `.env` files: one in the `internarea` directory and one in the `backend` directory. Do not expose your actual secret keys!

**`internarea/.env.local`**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_firebase_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_firebase_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_firebase_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_firebase_messaging_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_firebase_app_id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your_firebase_measurement_id>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<your_razorpay_key_id>
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

**`backend/.env`**
```env
DATABASE_URL=<your_mongodb_connection_string>
EMAIL_USER=<your_gmail_address>
EMAIL_PASS=<your_gmail_app_password>
JWT_SECRET=<your_jwt_secret>
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>
SERVER_BASE_URL=http://localhost:5001
```

### 3. Install Dependencies & Run the Backend
```bash
cd backend
npm install
npm start
```
*The backend will run on `http://localhost:5001`.*

### 4. Install Dependencies & Run the Frontend
Open a new terminal window:
```bash
cd internarea
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

## 🌐 Live Demo
The application is fully hosted and live.

**Live Website:** [https://internarea-ns0893222-8329s-projects.vercel.app/](https://internarea-ns0893222-8329s-projects.vercel.app/)

## 🔗 GitHub Repository
**Source Code:** [https://github.com/nitesh-20/Internshala](https://github.com/nitesh-20/Internshala)

## 📸 Screenshots

| Homepage | Dashboard |
|:---:|:---:|
| *(Placeholder for Homepage Screenshot)* | *(Placeholder for Dashboard Screenshot)* |

| Profile Page | Resume Builder |
|:---:|:---:|
| *(Placeholder for Profile Screenshot)* | *(Placeholder for Resume Builder Screenshot)* |

| Community/Networking | Login & Security History |
|:---:|:---:|
| *(Placeholder for Community Screenshot)* | *(Placeholder for Login History Screenshot)* |

## 🔮 Future Improvements
- AI-based resume analyzer and job matching score.
- Direct messaging and chat features within the community.
- Real-time notifications for application statuses.
- Advanced admin analytics dashboard.

## ✍️ Author
**Nitesh Sahu**
- GitHub: [@nitesh-20](https://github.com/nitesh-20)
