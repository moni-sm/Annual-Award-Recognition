# 🏆 Annual Award Recognition System

A fully-featured **MERN stack web application** developed to streamline the **employee nomination and award recognition process** in organizations.

> ⚠️ **Note**: This project was developed for an organization and contains proprietary code. The source code is not publicly available.

---

## 📌 Overview

The **Annual Award Recognition System** enables organizations to manage employee award nominations digitally. With role-based access, dynamic forms, and a clean interface, it simplifies everything from nomination submission to winner announcement.

## ⚙️ Tech Stack

| Technology     | Purpose                                         |
|----------------|-------------------------------------------------|
| 🟢 MongoDB      | NoSQL database for storing data                 |
| 🟨 Express.js   | Backend server and API routing                  |
| 🔵 React.js     | Frontend user interface for clients/admin       |
| 🟣 Node.js      | Server runtime environment for backend logic    |

---

## ✨ Key Features

### 👩‍💼 Employee/Client Panel

- 🔍 Filter by division for relevant nomination types  
- ✏️ Auto-filled nominee information for convenience  
- 🧾 Dynamic award-specific questions and attachments  
- 📱 Mobile-friendly, responsive design

### 🛠 Administrator Panel

- 📑 Dashboard to monitor and review nominations  
- 🏅 Declare winners and mark top nominations  
- 🔍 Filter by division or award type  
- 👥 Manage employee records (CRUD operations)  
- 📥 View, update, or delete submitted nominations

---

## 🏗️ Folder Structure

annual-reward-form/
├── admin/ → Admin dashboard (Vite + React)
├── client/ → Employee/client frontend (React)
├── server/ → Backend server (Node + Express + MongoDB)
└── README.md


> 📁 Codebase is confidential and cannot be made public.

---

## ⚙️ How It Works

### 👨‍💼 Employee Workflow
1. Choose division and award category
2. Fill out dynamic form fields specific to the award
3. Submit the nomination with required attachments

### 🧑‍💼 Admin Workflow
1. View and manage all nominations
2. Filter, export, and update nomination status
3. Declare winners and manage employee profiles
   
Admin Panel allows exporting all nominations to Excel for easy review, filtering, and record-keeping.
---

## 🔐 Security & Architecture

| Feature               | Description                                 |
|-----------------------|---------------------------------------------|
| 🔑 JWT Authentication | Secure user sessions via tokens             |
| 🌍 CORS Protection     | Safe cross-origin access                    |
| 🧩 Modular Controllers | Organized backend logic                     |
| 🛡 Role-Based Routing  | Access control for employee vs admin roles  |
| 📁 .env Configuration  | Keeps secrets like DB credentials private   |

---

## 📦 Deployment Ready

- Optimized Vite frontend builds  
- Connected to MongoDB Atlas  
- Configurable via `.env` for flexible deployment  
- Responsive and mobile-friendly

---

## 🧬 Backend Entities

- **Employee**: Stores name, ID, email, division, etc.  
- **Nomination**: Contains nominee info, award category, answers, and attachments  
- **Award Category**: Each with unique question sets and selection criteria  

---

## 🚀 Setup Instructions (Internal)

> Deployment access is restricted to authorized personnel.

### Backend (Server)
```bash
cd server
npm install
npm run dev

### Frontend (Client)
```bash
cd client
npm install
npm run dev

### Admin Panel
```bash
cd admin
npm install
npm run dev

🤝 Contact
For questions, collaborations, or demo inquiries:
📧 monikasm2019@gmail.com

📄 License
This project is governed under a Confidential Corporate License.
All rights reserved by the organization. Redistribution or reuse of the code is strictly prohibited.

Built with ❤️ using the MERN stack
Empowering digital recognition, one nomination at a time.


