# HealthChat AI: Intelligent Healthcare Platform

A full-stack, AI-powered healthcare application built to provide context-aware medical assistance, secure patient data management, and cloud-based medical record storage.



## 🚀 Features

### 1. Secure Authentication & Verification
* **Real-time OTP:** Identity verification via Gmail SMTP and Nodemailer to ensure secure user registration.
* **Role-Based Access:** Dedicated login flows for Patients and Administrators (Admin: healthchat88@gmail.com).

### 2. Digital Health Profile
* **Contextual Data:** Securely store and update personal details, chronic conditions, allergies, and current medications.
* **Data Persistence:** Built on Supabase (PostgreSQL) for reliable data retrieval and updates.

### 3. Cloud Medical Records
* **File Uploads:** Integrated Supabase Storage for uploading PDF reports and medical documents.
* **Instant Sync:** View and manage uploaded records directly within the user profile.

### 4. Smart AI Chatbot (Gemini 1.5 Flash)
* **Context-Aware Analysis:** The AI fetches the user's Supabase profile to provide personalized medical guidance.
* **Emergency Detection:** High-priority keyword scanning (e.g., "chest pain") triggers immediate emergency alerts to call 108.
* **RAG Implementation:** Simulates Retrieval-Augmented Generation by enriching AI prompts with patient history.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
* **Backend:** Next.js API Routes (Serverless)
* **Database:** Supabase (PostgreSQL)
* **Storage:** Supabase Storage (Cloud Buckets)
* **AI Engine:** Google Gemini 1.5 Flash API
* **Communication:** Nodemailer (SMTP Service)

---
