# 🎬 AI Video Recap Maker

AI-powered video recap creator for movies and TV shows using Google Gemini. Create professional montages with intelligent scene selection and automated voice-over generation.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)

## 🌟 Features

- **AI-Powered Processing**: Leverages Google Gemini for intelligent video analysis and content processing
- **In-Browser Video Editing**: Client-side FFmpeg processing with SharedArrayBuffer support
- **Configurable Montages**: Customize duration, intervals, and capture settings
- **Real-Time Processing**: Live progress tracking with detailed status updates
- **Cloud Storage**: Secure file storage and access via Supabase
- **Analytics & Stats**: Comprehensive usage tracking and visitor analytics
- **Responsive UI**: Modern, intuitive interface with Hebrew language support
- **Privacy First**: Files processed client-side, API keys never stored

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library

### Video Processing
- **FFmpeg** - Client-side video manipulation
- **SharedArrayBuffer** - High-performance video processing

### Backend & Storage
- **Supabase** - PostgreSQL database + File storage
- **Google Gemini AI** - Advanced AI processing

### Deployment
- **Netlify** - Hosting with Edge Functions
- **Progressive Web App** - Offline capabilities

## 📋 Prerequisites

- **Node.js** 18 or higher
- **Supabase** account and project
- **Google AI API** key (for Gemini)
- **Modern browser** supporting SharedArrayBuffer (Chrome, Edge, Safari 16.4+)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yaskovbs/RECAPS-MAKER-MASTER.git
cd RECAPS-MAKER-MASTER
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI API Key (secure handling recommended)
VITE_GOOGLE_API_KEY=your_google_ai_api_key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:

```bash
# Apply all migrations in order
supabase db reset
# Or apply manually through Supabase dashboard
```

The project includes the following migrations:
- User statistics and visitor tracking
- Generated recaps storage
- Contact messages system
- Secure database functions

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 📖 Usage Guide

### Creating Video Recaps

1. **Upload Video**: Select your movie/TV show file (MP4, MOV, AVI supported)
2. **Configure Settings**:
   - **Duration**: Total length of final recap video
   - **Interval**: Time between captured scenes
   - **Capture Length**: Duration of each individual clip
3. **Add Script**: Paste your voice-over script for AI processing
4. **Generate**: Click "Create Video Recap" to start processing

### Supported Formats
- **Input**: MP4, MOV, AVI, MKV
- **Output**: MP4 with H.264 video codec
- **Resolution**: Maintains original aspect ratio

### Performance Tips
- Processing happens entirely in-browser
- Large videos (>2GB) may benefit from shorter clips
- Chrome provides best performance for video processing

## 🏗 Architecture

### System Flow
```
Video Upload → FFmpeg Processing → Scene Selection → AI Enhancement → Cloud Storage → User Download
```

### Component Structure
```
src/
├── components/          # UI Components
│   ├── HomePage.tsx    # Main video processing interface
│   ├── VideoUploader.tsx # File upload component
│   ├── ProcessingStatus.tsx # Real-time status display
│   └── ResultsSection.tsx # Final output viewer
├── lib/
│   └── supabase.ts     # Database client
└── types/
    └── index.ts       # TypeScript type definitions
```

### Database Schema
- **Users**: Visitor tracking and analytics
- **Generated Recaps**: Stored video metadata and paths
- **Stats**: Application usage metrics
- **Contact Messages**: User inquiries and feedback

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
```

## Supabase Local Setup

Follow these steps to set up a local Supabase environment for development.

- **Create env file**: copy the example and fill values.

   - File: [.env.example](RECAPS-MAKER-master/.env.example)

- **Install dependencies**:

```powershell
npm install
```

- **Supabase CLI (local)**: Install the Supabase CLI and login.

```powershell
supabase login
supabase link --project-ref $PROJECT_ID
```

- **Pull remote schema (if using existing project)**:

```powershell
supabase db pull
```

- **Start local Supabase**:

```powershell
supabase start
```

- **Apply migrations locally** (recreate and apply all migrations):

```powershell
supabase db reset
```

- **Run the dev server**:

```powershell
npm run dev
```

Notes:
- Do NOT commit your real `.env` to git.
- Add required CI secrets in GitHub for automatic deployments (`SUPABASE_ACCESS_TOKEN`, `STAGING_PROJECT_ID`, `STAGING_DB_PASSWORD`, `PRODUCTION_PROJECT_ID`, `PRODUCTION_DB_PASSWORD`).+
+## Development Container (Dev Container)
+
+The repo includes a VS Code Dev Container config. This lets you open the project inside a preconfigured container with Node.js, Docker-in-Docker, and extensions already installed.
+
+1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop).
+2. In VS Code, install the "Remote - Containers" extension.
+3. Open this folder (`RECAPS-MAKER-master/RECAPS-MAKER-master`) and click **Reopen in Container** when prompted.
+4. After the container builds, the workspace will run `npm install` automatically.
+5. Use the terminal inside the container to run `npm run dev` and `npx supabase start` (Docker is available).
+
+Ports 5173/5174 (frontend) and 54323 (Supabase) are forwarded by default.
+
# Quality Assurance
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Code Quality
- **ESLint**: Code linting and style enforcement
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (via editor)

### Testing
```bash
# Run tests (when added)
npm run test
npm run test:watch
npm run test:coverage
```

## 🚢 Deployment

### Netlify Setup

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Node Version: 18

3. **Environment Variables**: Configure in Netlify dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_API_KEY=your_google_api_key
   ```

4. **COOP/COEP Headers**: Required for SharedArrayBuffer support:
   ```
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   Permissions-Policy: display-capture=(self)
   ```

### Performance Optimizations
- Files served via Netlify CDN
- Client-side video processing reduces server load
- Optimized bundle size through Vite

## 🔧 Configuration

### Video Processing Settings
- **FFmpeg Core**: Hosted on unpkg CDN
- **Video Codec**: H.264 with WebM fallback
- **Audio**: Stripped from clips (voice-over handled separately)
- **Quality**: Original quality maintained

### Security Features
- API keys handled client-side only
- Files uploaded directly to Supabase storage
- No sensitive data stored in local storage
- HTTPS required for SharedArrayBuffer

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Maintain Hebrew language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

**Developer**: [Your Name]
**Email**: yaskovbs2502@gmail.com
**Issues**: [GitHub Issues](https://github.com/yaskovbs/RECAPS-MAKER-MASTER/issues)
**Documentation**: [Project Wiki](https://github.com/yaskovbs/RECAPS-MAKER-MASTER/wiki)

---

**Built with ❤️ using React, TypeScript, and cutting-edge AI technology**

*הערה: ממשק המשתמש של היישום כולו בעברית, מה שהופך אותו לחוויה טבעית עבור משתמשים דוברי עברית.*
