# Student AI Learning Assistant 🎓

![Student AI Banner](https://res.cloudinary.com/dyhvfai21/image/upload/cover-Pic_nem1jv.png)

> An AI-powered learning assistant designed to help students learn through natural language conversations, document analysis, and interactive quizzes.

[![Next.js](https://img.shields.io/badge/built%20with-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![DaisyUI](https://img.shields.io/badge/UI-DaisyUI-5cc4b8?style=flat-square)](https://daisyui.com/)
[![Tailwind CSS](https://img.shields.io/badge/styled%20with-Tailwind-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

## ✨ Features

- 💬 **Interactive AI Chat** - Have conversations with an AI tutor about your study materials
- 📝 **Document Q&A** - Upload documents and ask specific questions about them
- 🎬 **YouTube Content Analysis** - Process videos and learn from their content
- 🎯 **Interactive Quizzes** - Test your knowledge with auto-generated quizzes
- 🔊 **Voice Input** - Use speech recognition for hands-free interaction
- 📊 **Progress Tracking** - Monitor your learning progress
- 🌙 **Dark/Light Mode** - Choose your preferred theme

## 🚀 Live Demo

[🔗 Student AI Live website](https://student-ai-next.vercel.app)
> [!IMPORTANT]
> The demo may not have all features fully functional due to "HARDWARE" limitations. The front end was deployed to Vercel, and the back end was deployed to Render.
> File upload doesn't work on a live server as it needs more computational power than a generous free tire can offer! So, try to run locally.

## 📷 Screenshots & Demo

<details>
<summary>View Screenshots</summary>

### Home Page
![Home Page](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_020520_wwhqsf.png)

### Sign In Page
![Sign In Page](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_020736_zjis7x.png)

### Dashboard
![Dashboard](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_020841_myam25.png)


### Document Upload
![Document Upload](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_021305_b2yieh.png)

### Quiz
![Quiz](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_021400_eyeqpn.png)
![Quiz Result](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_021940_h0rda0.png)

### Chat Interface
![Chat Interface](https://res.cloudinary.com/dyhvfai21/image/upload/Screenshot_2025-04-04_022049_h8ldvz.png)

</details>

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- Backend API running ([Follow backend setup instructions here](https://github.com/mehedi37/student_ai_backend))

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/mehedi37/student_ai_next.git
cd student_ai_next
```

2. **Install dependencies**

```bash
npm install
# or
yarn
```

3. **Configure environment variables**

Create a .env file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. **Run development server**

```bash
npm run dev
# or
yarn dev
```

5. **Open in browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
student_ai_next/
├── app/               # Next.js app directory (app router)
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   ├── chat/          # Chat interface pages
│   ├── components/    # App-specific components
│   ├── contexts/      # React contexts
│   ├── dashboard/     # Dashboard pages
│   ├── quizzes/       # Quiz functionality
│   ├── upload/        # File upload functionality
│   ├── globals.css    # Global styles
│   ├── layout.js      # Root layout
│   └── page.js        # Home page
├── components/        # Shared components
│   ├── ChatInterface.js
│   ├── ChatMessage.js
│   └── ...
├── public/           # Static assets
├── utils/            # Utility functions
│   └── api.js        # API client
└── README.md
```

## 💡 Core Functionality

### Authentication Flow

Student AI uses JWT-based authentication. Users can sign up, sign in, and manage their sessions.

### Chat System

The chat interface allows you to:
- Start new chat sessions
- Continue previous conversations
- Upload and analyze documents
- Use voice input for queries

### Quiz System

Student AI features an advanced quiz system:
- Automatically generated quizzes based on your content
- Interactive UI with real-time feedback
- Explanations for correct answers
- Score tracking and review

### Document Processing

Upload various document types:
- PDFs
- Word documents
- Plain text files
- YouTube videos and playlists

## 🧰 Technologies Used

- **Frontend**
  - [Next.js 15](https://nextjs.org/) - React framework
  - [React 19](https://reactjs.org/) - UI library
  - [DaisyUI 5](https://daisyui.com/) - Tailwind CSS component library
  - [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
  - [Lucide React](https://lucide.dev/) - Icon library

- **API Integration**
  - Custom API client using Fetch API
  - JWT authentication

- **Other Libraries**
  - [date-fns](https://date-fns.org/) - Date manipulation
  - [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
  - [wavesurfer.js](https://wavesurfer-js.org/) - Audio visualization

## 🛣️ Roadmap

- [ ] Mobile app version
- [ ] Group study sessions
- [ ] Advanced analytics dashboard
- [ ] Custom AI model integration
- [ ] Offline mode support
- [ ] Fix some minor bugs and improve performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**হাট্টিমাটিম_Team** - [GitHub Profile](https://github.com/mehedi37)

---

<div align="center">
  Made with ❤️ by হাট্টিমাটিম_Team
  <br>
  © 2025 Student AI - All Rights Reserved
</div>
