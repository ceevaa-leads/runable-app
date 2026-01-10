# Ceevaa - Lead Generation Platform

A modern lead generation platform for US local service businesses (janitorial, HVAC, landscaping, etc.) that replaces expensive agency-driven lead-gen with automated warm-lead discovery and outreach.

## Features

- 🔐 **Secure Authentication** - Signup with account code validation, login, and password reset
- 🌓 **Light/Dark Theme** - Full theme support with system preference detection
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🏗️ **SOLID Architecture** - Clean, maintainable code following SOLID principles
- ⚡ **Modern Stack** - Built with React 18, TypeScript, and Vite

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context + TanStack Query
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: CSS Custom Properties with Light/Dark themes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Xano backend instance with the required API endpoints

### Installation

1. Clone the repository:
\`\`\`bash
cd frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update the \`.env\` file with your Xano API URL:
\`\`\`
VITE_XANO_API_URL=https://your-instance.xano.io/api:your-api-group
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Alert, etc.)
│   ├── Logo.tsx        # Brand logo component
│   └── ProtectedRoute.tsx
├── config/             # Configuration files
│   └── api.ts          # API configuration
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   └── ThemeContext.tsx # Theme management
├── hooks/              # Custom React hooks
│   └── useForm.ts      # Form handling hook
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   └── dashboard/      # Dashboard pages
│       └── DashboardPage.tsx
├── services/           # API services
│   ├── api.service.ts  # Base API client
│   └── auth.service.ts # Authentication service
├── styles/             # CSS styles
│   └── index.css       # Main stylesheet with themes
├── types/              # TypeScript type definitions
│   └── auth.types.ts
├── App.tsx             # Main app component
└── main.tsx            # Entry point
\`\`\`

## API Endpoints Required

The frontend expects these Xano API endpoints:

- \`POST /auth/signup\` - User registration with account code validation
- \`POST /auth/login\` - User authentication
- \`GET /auth/me\` - Get current user profile
- \`GET /reset/request-reset-link\` - Request password reset
- \`POST /reset/magic-link-login\` - Magic link authentication
- \`POST /reset/update_password\` - Update password

## Signup Flow

1. User enters their details including an **Account Code**
2. The account code is validated against the \`client_account_code\` in the \`account\` table
3. If valid, the user is created and associated with that account
4. User receives an auth token and is redirected to the dashboard

## Theme Support

The application supports both light and dark themes:

- Automatically detects system preference
- Manual toggle available in the header
- Theme preference is persisted in localStorage

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the \`dist/\` directory.

## License

Private - All rights reserved
