# Expensey - Personal Finance Tracker

A modern, intuitive expense tracking application built with Next.js 15, designed to help you take control of your finances through smart categorization, visual analytics, and goal tracking.

## Features

### 💰 Expense Management
- **Smart Categorization**: Organize expenses into categories (Needs, Wants, Self-Development, Savings)
- **Subcategory Support**: Add custom subcategories for detailed tracking
- **Quick Entry**: Streamlined form for fast expense logging
- **Edit & Delete**: Full CRUD operations on all expenses

### 📊 Visual Analytics
- **Interactive Charts**: Beautiful, responsive charts powered by Recharts
- **Category Breakdown**: Pie charts showing expense distribution
- **Monthly Trends**: Track spending patterns over time
- **Real-time Updates**: Instant visualization of your financial data

### 💎 Savings Tracking
- **Monthly Goals**: Set and track savings targets
- **Progress Visualization**: See your savings growth over time
- **Historical Data**: View past savings performance

### 🏠 Utility Management
- **Custom Utility Types**: Create and manage your own utility categories
- **Flexible Tracking**: Adapt the app to your specific needs

### 🎨 Premium UI/UX
- **Modern Design**: Clean, minimalist interface with smooth animations
- **Dark Mode**: Full dark mode support for comfortable viewing
- **Responsive**: Works seamlessly on desktop and mobile devices
- **Interactive Elements**: Engaging hover effects and transitions

### 🔐 Security & Authentication
- **Kinde Auth**: Secure authentication with social login options
- **User Isolation**: Each user's data is private and secure
- **Session Management**: Persistent login with secure session handling

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma 6
- **Authentication**: Kinde Auth
- **Styling**: Tailwind CSS 4 + CSS-in-JS animations
- **UI Components**: Custom components with Radix UI primitives
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Neon account)
- Kinde Auth account for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/expensey.git
cd expensey
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL="your_postgresql_connection_string"

# Kinde Auth
KINDE_CLIENT_ID="your_kinde_client_id"
KINDE_CLIENT_SECRET="your_kinde_client_secret"
KINDE_ISSUER_URL="your_kinde_issuer_url"
KINDE_SITE_URL="http://localhost:3000"
KINDE_POST_LOGOUT_REDIRECT_URL="http://localhost:3000"
KINDE_POST_LOGIN_REDIRECT_URL="http://localhost:3000/dashboard"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

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