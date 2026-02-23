# HealthChat AI: AI-Driven Public Health Chatbot

An advanced, multilingual healthcare solution designed for rural and semi-urban communities. This project provides accessible medical guidance, household health management, and visual symptom analysis using state-of-the-art AI.



## 🌟 Key Features

### 👨‍👩‍👧‍👦 Household Management
* **Family Sub-Profiles:** Manage health records for up to 4 members (Primary user + 3 family members) under a single account.
* **Separated Data:** Each member maintains their own medical history, allergies, and chat history.

### 🤖 Intelligence & Vision
* **Multimodal Analysis:** Upload images of skin conditions or allergies for instant visual analysis.
* **Smart Context:** The AI references specific patient profiles (Age, Medications, History) before providing advice.
* **Powered by Llama 4 Scout:** Utilizing high-speed inference via Groq for near-instant responses.

### 🌍 Accessibility & Language
* **Multilingual Support:** Communicate in **Tamil, Hindi, Telugu, Kannada, and English**.
* **Voice Input (STT):** Speak your symptoms in regional languages—perfect for those who struggle with typing.
* **Voice Output (TTS):** The AI reads responses aloud with natural Indian accents.

### 🛡️ Admin & Security
* **Command Center:** Admin dashboard to moderate content, suspend users, and view household stats.
* **Broadcast System:** Send mass email updates (vaccination alerts, health tips) via the Admin panel.
* **Secure Storage:** All medical reports and chats are encrypted and stored in Supabase.



## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Next.js 15, Tailwind CSS |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | Supabase (PostgreSQL) |
| **AI Model** | Meta Llama 4 Scout (via Groq SDK) |
| **Storage** | Supabase Storage (Buckets) |
| **Communication** | Nodemailer (SMTP) |
| **Tools** | html2pdf.js, Lucide Icons, Web Speech API |
