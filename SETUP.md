# Quick Setup Guide

Follow these steps to get your VBCL Alwar Production Tracker up and running in minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

The `.env` file should already be created. If not, copy from `.env.example`:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

The default `.env` contains:
- ✅ Database configuration (SQLite)
- ✅ NextAuth configuration (ready to use)
- ⚠️ Google Sheets credentials (needs setup - optional for initial testing)

## 3. Initialize Database

The database migrations are already applied. If you need to reset:

```bash
npm run db:migrate
```

## 4. Create Your First User

Use the included script:

```bash
node scripts/create-user.js admin yourpassword123
```

Or use npm:

```bash
npm run db:seed admin yourpassword123
```

## 5. Start the Development Server

```bash
npm run dev
```

## 6. Access the Application

Open your browser and navigate to:
- **URL**: http://localhost:3000
- **Login**: Use the credentials you created in step 4

## 7. (Optional) Set Up Google Sheets Sync

See the main [README.md](README.md) for detailed Google Sheets setup instructions.

For initial testing, you can skip this step and use the app without Google Sheets integration.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `node scripts/create-user.js <username> <password>` | Create a new user |

## Next Steps

1. ✅ Log in with your credentials
2. ✅ Click "New Entry" to create your first production record
3. ✅ Test the Pending → Completed workflow
4. ✅ Set up Google Sheets integration (see README.md)

## Troubleshooting

**Problem**: Database migration errors
- **Solution**: Delete `dev.db` and run `npm run db:migrate` again

**Problem**: Cannot create user
- **Solution**: Make sure the database migrations have run successfully

**Problem**: Port 3000 already in use
- **Solution**: Use a different port: `npm run dev -- -p 3001`

For more detailed information, see [README.md](README.md).

