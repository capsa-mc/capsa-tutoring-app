# CAPSA-MC Tutoring Platform

A modern web application built with Next.js and Supabase for providing online tutoring services.

## Features

- 🔐 Secure Authentication
  - Email/Password Registration
  - Password Reset Functionality
  - Protected Routes
  - Session Management

- 👤 User Management
  - User Profiles
  - Role-based Access Control
  - Account Settings

- 🎨 Modern UI/UX
  - Responsive Design
  - Tailwind CSS Styling
  - Loading States
  - Error Handling
  - Toast Notifications

## Tech Stack

- **Frontend Framework**: [Next.js 14](https://nextjs.org/)
- **Authentication & Database**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/capsa-tutoring-app.git
cd capsa-tutoring-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
capsa-tutoring-app/
├── src/
│   ├── app/              # App Router components
│   ├── components/       # Reusable components
│   ├── lib/             # Utility functions and configurations
│   ├── pages/           # Pages Router components
│   └── styles/          # Global styles
├── public/              # Static files
├── .env.local          # Local environment variables
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Project dependencies
```

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm start` - Runs the built app in production mode
- `npm run lint` - Runs ESLint for code linting

## Deployment

The application is configured for deployment on Vercel. Simply push to your repository and Vercel will automatically deploy your changes.

For manual deployment:

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@capsa-mc.com or join our Slack channel.

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
