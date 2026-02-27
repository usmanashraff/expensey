<div align="center">

# 💰 Expensey

**Your Personal Finance Companion**

![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-06B6D4?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6.13-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green)

A modern, intelligent expense tracking application that puts you in control of your finances. Built with cutting-edge technologies, featuring AI-powered insights, beautiful visualizations, and a delightful user experience.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 💳 **Smart Expense Management**
- 🎯 **Intelligent Categorization** - Organize expenses into Needs, Wants, Self-Development, and Savings categories
- 📝 **Custom Subcategories** - Create flexible subcategories tailored to your spending habits
- ⚡ **Quick Entry Options** - Two modes for adding expenses:
  - 🤖 **AI-Powered Natural Language Input** - Simply tell Expensey what you spent (e.g., "Spent $50 on groceries")
  - 📋 **Traditional Form** - Detailed manual entry with full control
- 📸 **Receipt Management** - Attach multiple receipts to expenses for documentation
- ✏️ **Full CRUD Operations** - Edit, delete, and manage all your expenses

### 📊 **Visual Analytics & Insights**
- 📈 **Interactive Charts** - Beautiful, responsive visualizations powered by Recharts
- 🥧 **Category Breakdown** - Pie charts showing your spending distribution
- 📉 **Monthly Trends** - Track spending patterns month-over-month
- 🎯 **Budget Tracking** - Set and monitor budgets for each category
- 🤖 **AI Analysis** - Get intelligent insights about your spending habits powered by Groq
- 🚨 **Smart Alerts** - Receive warnings when approaching budget limits

### 💎 **Savings & Goals**
- 🎯 **Goal Setting** - Set monthly savings targets
- 📊 **Progress Tracking** - Visualize your progress toward savings goals
- 📅 **Historical Data** - View and analyze past savings performance
- 💹 **Savings Trends** - Track how your savings grow over time

### 💰 **Income Management**
- 📥 **Income Tracking** - Record all sources of income
- 🔄 **Recurring Income** - Mark income as recurring for salary and regular payments
- 📊 **Income vs. Expense** - Compare your earnings against spending
- 📈 **Income Statistics** - Monthly and yearly income reports

### 🏠 **Custom Utility Management**
- 🛠️ **Flexible Categories** - Create and manage custom utility types beyond standard categories
- 📋 **Utility Tracking** - Monitor expenses for each utility type
- 🎯 **Personalized Setup** - Adapt the app to your specific needs

### 🎨 **Premium User Experience**
- 🌓 **Dark Mode** - Full dark mode support with system preference detection
- 📱 **Fully Responsive** - Seamless experience on desktop, tablet, and mobile
- ✨ **Smooth Animations** - Elegant micro-interactions using Framer Motion
- 🎭 **Modern Design** - Clean, minimalist interface inspired by contemporary design principles
- ♿ **Accessible** - Built with accessibility in mind using Radix UI

### 🔐 **Security & Authentication**
- 🔒 **Kinde Auth** - Enterprise-grade authentication with social login options
- 🛡️ **Data Privacy** - Each user's financial data is completely isolated and secure
- 🔐 **Session Management** - Persistent, secure login with automatic session handling
- 👤 **User Profiles** - Customizable user settings and preferences

### 💱 **Multi-Currency Support**
- 🌍 **Global Currency Support** - Track expenses in different currencies
- 💱 **Currency Switching** - Change default currency in settings
- 🏦 **Per-Expense Currency** - Set currency for individual expenses

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15.4](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) - Type-safe JavaScript
- **UI Library**: [React 19.1](https://react.dev/) - Modern React with latest features
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Form handling and validation
- **Animations**: [Framer Motion](https://www.framer.com/motion/) - Production-ready animations
- **Charts**: [Recharts](https://recharts.org/) - React charting library
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful icon library
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- **Theme**: [Next Themes](https://github.com/pacocoursey/next-themes) - Dark mode support

### Backend & Database
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Powerful open-source database
- **Serverless Database**: [Neon](https://neon.tech/) - Serverless Postgres with autoscaling
- **ORM**: [Prisma 6](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM
- **AI Integration**: [Groq SDK](https://groq.com/) - Fast language model inference

### Authentication
- **Auth Provider**: [Kinde](https://kinde.com/) - OAuth 2.0 authentication platform
- **Next.js Integration**: [@kinde-oss/kinde-auth-nextjs](https://github.com/kinde-oss/kinde-auth-nextjs)

### Additional Tools
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/)
- **Data Generation**: Custom seed utilities for development

### Deployment
- **Hosting**: Optimized for [Vercel](https://vercel.com/)
- **Development**: [Turbopack](https://turbo.build/pack) for fast builds

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (or yarn/pnpm)
- **PostgreSQL** (or a Neon account for serverless Postgres)

You'll also need accounts for:
- [Kinde Auth](https://kinde.com/) - For authentication
- [Groq](https://console.groq.com/) - For AI insights (optional but recommended)

### Installation & Setup

#### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/expensey.git
cd expensey
```

#### 2. **Install Dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

#### 3. **Configure Environment Variables**

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/expensey"
# Or for Neon Serverless:
# DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.neon.tech/expensey"

# Kinde Authentication
KINDE_CLIENT_ID="your_kinde_client_id"
KINDE_CLIENT_SECRET="your_kinde_client_secret"
KINDE_ISSUER_URL="https://your-domain.kinde.com"
KINDE_SITE_URL="http://localhost:3000"
KINDE_POST_LOGOUT_REDIRECT_URL="http://localhost:3000"
KINDE_POST_LOGIN_REDIRECT_URL="http://localhost:3000/dashboard"

# Groq AI (Optional - for AI insights)
NEXT_PUBLIC_GROQ_API_KEY="your_groq_api_key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 4. **Set Up the Database**

Generate Prisma client and run migrations:
```bash
# Generate Prisma client
npx prisma generate

# Create/update database schema
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

#### 5. **Start Development Server**

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
expensey/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── ai/            # AI endpoints (analyze-spending, parse-expense)
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── expenses/      # Expense CRUD operations
│   │   │   ├── income/        # Income management
│   │   │   ├── savings/       # Savings tracking
│   │   │   └── ...
│   │   ├── dashboard/         # Main dashboard
│   │   ├── settings/          # User settings
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/             # Reusable React components
│   │   ├── ui/               # Base UI components (Button, Card, Dialog, etc.)
│   │   ├── ai-insights.tsx   # AI analysis component
│   │   ├── smart-expense-input.tsx  # AI + manual input
│   │   ├── expense-charts.tsx # Expense visualizations
│   │   ├── dashboard-client.tsx # Dashboard logic
│   │   └── ...
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── use-user-settings.ts
│   │
│   ├── lib/                   # Utility functions & helpers
│   │   ├── auth.ts           # Authentication helpers
│   │   ├── prisma.ts         # Prisma client instance
│   │   └── utils.ts          # General utilities
│   │
│   ├── middleware.ts          # Next.js middleware for auth
│   ├── globals.css           # Global styles
│   └── app.config.ts         # App configuration

├── prisma/
│   ├── schema.prisma         # Database schema definition
│   └── migrations/           # Database migrations

├── public/                    # Static assets

├── package.json              # Dependencies & scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
└── README.md                 # This file
```

---

## 🎯 Core Features Explained

### AI-Powered Expense Input
Leverage natural language processing to log expenses quickly. Simply say "I spent $50 on groceries" and the AI will parse it and categorize it automatically.

### Smart Budget Management
Set category-specific budgets and get real-time feedback on your spending. Visual indicators show you how close you are to your limits.

### Insightful Analytics
View detailed breakdowns of your spending with interactive charts. Understand your financial habits at a glance with monthly trends and category distributions.

### Secure Multi-User Environment
Each user's data is completely isolated. Login securely with Kinde Auth and access your financial data from any device.

---

## 🔑 Key API Endpoints

### Expenses
- `GET /api/expenses` - Fetch user's expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Income
- `GET /api/income` - Fetch income records
- `POST /api/income` - Create income entry
- `PUT /api/income/[id]` - Update income
- `GET /api/income/stats` - Get income statistics
- `GET /api/income/comparison` - Compare with expenses

### Savings
- `GET /api/savings` - Fetch savings records
- `POST /api/savings` - Create savings entry
- `GET /api/savings/history` - Savings history

### Budget
- `GET /api/budget` - Fetch budget
- `POST /api/budget` - Create/update budget

### AI
- `POST /api/ai/parse-expense` - Parse natural language to expense
- `POST /api/ai/analyze-spending` - Get AI insights on spending

### User
- `GET /api/user` - Get user profile
- `GET /api/user-settings` - Get user settings
- `POST /api/user-settings` - Update settings

---

## 🎨 Customization

### Theme Customization
Customize colors by editing the Tailwind CSS configuration in `tailwind.config.js`

### Currency Settings
Change the default currency in user settings. The app supports decimal values and custom currency symbols.

### Add Custom Categories
Create custom subcategories for your expenses to match your specific needs.

---

## 📊 Database Schema

### Core Models

**User** - Stores user profile information
- Linked to Kinde authentication
- Stores basic profile data (name, avatar, etc.)

**Expense** - Records individual expenses
- Categories: Needs, Wants, Self-Development, Savings
- Supports custom subcategories
- Multi-currency support
- Receipt storage

**Income** - Tracks income sources
- Support for recurring income
- Multiple income sources
- Date and amount tracking

**Savings** - Monthly savings goals and progress
- Monthly tracking with year/month combo
- Progress visualization

**Budget** - Category-based budgets
- Separate budgets for each category
- Monthly tracking
- Currency support

**UserSettings** - User preferences
- Default currency selector
- Customizable preferences

**UtilityType** - Custom utility categories
- User-defined utility types
- Flexible categorization

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙋 Support

For support, email support@expensey.com or open an issue on GitHub.

---

## 🚀 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced budgeting strategies
- [ ] Investment tracking
- [ ] Bill reminders
- [ ] Collaborative expense sharing
- [ ] Data export (CSV, PDF)
- [ ] Advanced reporting

---

<div align="center">

**Made with ❤️ by the Expensey Team**

[⬆ Back to Top](#-expensey)

</div>

## Project Structure

```
expensey/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Protected dashboard pages
│   │   └── (public pages)     # Landing, about, etc.
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   └── (features)        # Feature-specific components
│   ├── lib/                   # Utility functions
│   └── generated/             # Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## Database Schema

The application uses the following main models:

- **Expense**: Tracks individual expenses with amount, description, category, and date
- **Savings**: Monthly savings records
- **UtilityType**: Custom utility categories defined by users

## Deployment

### Vercel Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The build process automatically runs `prisma generate` to ensure the Prisma client is properly generated.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Built with ❤️ by Usman Ashraf

---

*Note: This is a personal finance tracking application. Always ensure you're following best practices for financial data security and privacy.*