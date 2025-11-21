# Local PostgreSQL Database Setup Guide

This guide will help you set up a local PostgreSQL database for testing before deploying to Coolify.

## Option 1: Using Docker (Recommended - Easiest)

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running on your Windows machine.

### Step 2: Start PostgreSQL Container
Run this command in your project directory:

```powershell
docker-compose up -d
```

This will:
- Start a PostgreSQL 15 container
- Create a database named `alwar_db`
- Expose it on port `5432`
- Set username: `postgres` and password: `testpassword123`

### Step 3: Verify Container is Running
```powershell
docker ps
```

You should see `alwar-postgres-local` container running.

### Step 4: Create `.env.local` File
Create a file named `.env.local` in your project root with:

```env
# Local PostgreSQL Database
DATABASE_URL="postgresql://postgres:testpassword123@localhost:5432/alwar_db"

# NextAuth Configuration
NEXTAUTH_SECRET="local-test-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Google Sheets API (Optional - leave commented for local testing)
# GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----"
# GOOGLE_SHEET_ID="your-google-sheet-id"
```

### Step 5: Generate Prisma Client and Run Migrations
```powershell
# Navigate to project directory
cd "c:\Users\RintuMondal\Videos\On-going project\alwar"

# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev
```

### Step 6: Verify Connection
```powershell
# Open Prisma Studio to view your database
npx prisma studio
```

This will open a web interface at `http://localhost:5555` where you can see your database tables.

### Step 7: Test the Application
```powershell
npm run dev
```

Then create a test user:
```powershell
node scripts/create-user.js admin testpassword123
```

## Option 2: Install PostgreSQL Locally

If you prefer not to use Docker:

1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Install PostgreSQL** with default settings
3. **Create Database**:
   ```sql
   CREATE DATABASE alwar_db;
   ```
4. **Update `.env.local`**:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/alwar_db"
   ```

## Stopping the Docker Container

When you're done testing:
```powershell
docker-compose down
```

To remove the data volume as well:
```powershell
docker-compose down -v
```

## Troubleshooting

### Port 5432 Already in Use
If you have PostgreSQL already installed locally, either:
- Stop the local PostgreSQL service, OR
- Change the port in `docker-compose.yml` to something else like `5433:5432`

### Docker Desktop Not Running
Start Docker Desktop from the Start menu, wait for it to fully start, then try again.

### Connection Refused
Make sure the container is running: `docker ps`
Check container logs: `docker logs alwar-postgres-local`

## Next Steps

Once local testing is complete:
1. Update `.env.local` with your Coolify PostgreSQL connection string
2. Or set environment variables directly in Coolify dashboard
3. Deploy to Coolify

