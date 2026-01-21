# Outlook Client Manager

A multi-account Outlook email management dashboard with offline caching support.

## Features

- Multi-account Outlook email management
- Email fetching via Microsoft Graph API
- Offline email caching with IndexedDB
- Mobile-responsive UI with slide-out sidebar
- Recently Accessed / Inactive account categorization
- Copy email address functionality

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Caching**: IndexedDB for offline support
- **Email API**: Microsoft Graph API via Python scripts

## Project Structure (Monorepo)

```
outlook-client-manager/
├── apps/
│   └── web/              # Next.js web application
│       ├── src/
│       ├── prisma/
│       └── public/
├── scripts/              # Utility scripts
│   ├── import-accounts.ts
│   ├── email_fetcher.py
│   └── delete_email.py
├── package.json          # Root workspace config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database (we use Neon)

### Installation

```bash
# Install all dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your DATABASE_URL

# Run database migrations
cd apps/web && npx prisma migrate dev

# Start development server
npm run dev
```

### Import Accounts

```bash
# Create accounts.txt with format: email:password:refresh_token:client_id
cd scripts
cp ../apps/web/.env .env
npm install
npm run import-accounts
```

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set **Root Directory** to `apps/web`
3. Add environment variable `DATABASE_URL`
4. Deploy!

## License

MIT
