# Learning and Assessment Portal

A full-stack web application for online learning and assessments, featuring interactive coding challenges, course management, and user authentication.

## 🚀 Features

- **Interactive Code Editor**: Built-in Monaco Editor for coding assessments
- **User Authentication**: Google OAuth integration for secure login
- **Course Management**: Comprehensive learning portal with structured content
- **Assessment System**: Create and take coding assessments with real-time evaluation
- **Modern UI/UX**: Responsive design with Tailwind CSS
- **Form Validation**: Robust form handling with React Hook Form and Zod

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with modern features
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **TanStack Query** - Powerful data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - VSCode-powered code editor
- **Lucide React** - Beautiful icon library

### Backend
- Node.js backend (details in `/backend` directory)

### Key Libraries
- `@react-oauth/google` - Google authentication
- `axios` - HTTP client
- `react-hook-form` + `zod` - Form validation
- `react-hot-toast` - Elegant notifications
- `jwt-decode` - JWT token handling

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SHEIKABDULLAHPM/learning-and-assessment-portal.git
   cd learning-and-assessment-portal
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Variables**
   
   Create `.env` files in both frontend and backend directories:
   
   **Frontend `.env`:**
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
   
   **Backend `.env`:**
   ```env
   PORT=5000
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

## 🚀 Running the Application

### Development Mode

**Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

**Backend:**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
learning-and-assessment-portal/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   └── App.jsx       # Main app component
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Node.js backend
│   └── ...
└── README.md
```

## 🧪 Development

### Code Linting
```bash
cd frontend
npm run lint
```

### Code Formatting
Follow ESLint rules configured in the project for consistent code style.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**SHEIKABDULLAHPM**
- GitHub: [@SHEIKABDULLAHPM](https://github.com/SHEIKABDULLAHPM)

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the blazing-fast build tool
- All open-source contributors whose libraries made this project possible

## 📞 Support

If you have any questions or need help, please open an issue in the repository.

---

Made with ❤️ by SHEIKABDULLAHPM
