# Deployment Guide

This guide covers deploying the VBCL Alwar Production Tracker to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:
- ✅ Git repository set up
- ✅ Code committed to GitHub/GitLab/Bitbucket
- ✅ Environment variables ready
- ✅ Google Sheets credentials (optional, but recommended)

## Platform-Specific Guides

### 1. Vercel (Recommended for Next.js)

Vercel is the easiest option for Next.js applications.

#### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add these in Vercel dashboard under "Settings" → "Environment Variables":
   ```
   DATABASE_URL=file:./prod.db
   NEXTAUTH_SECRET=<generate-a-secure-random-string>
   NEXTAUTH_URL=https://your-app.vercel.app
   GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
   GOOGLE_SHEET_ID=your-sheet-id
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Create First User**
   After deployment, create a user via API:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"secure-password"}'
   ```

#### Important Notes for Vercel:
- ⚠️ **SQLite limitations**: Vercel's serverless functions have read-only file systems
- 🔄 **Solution**: Migrate to a hosted database (see below)

### 2. Vercel with PostgreSQL (Recommended for Production)

For a production deployment on Vercel, use PostgreSQL instead of SQLite.

#### Steps:

1. **Set up PostgreSQL**
   - Option A: [Neon.tech](https://neon.tech) (free tier available)
   - Option B: [Supabase](https://supabase.com) (free tier available)
   - Option C: [Railway](https://railway.app) PostgreSQL

2. **Update Prisma Schema**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Update DATABASE_URL**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

4. **Run Migration**
   ```bash
   npx prisma migrate dev
   ```

5. **Deploy to Vercel**
   Follow steps from section 1 above

### 3. Railway

Railway supports both SQLite and PostgreSQL out of the box.

#### Steps:

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure Build**
   Railway auto-detects Next.js. No additional config needed.

3. **Add Environment Variables**
   In Railway dashboard:
   ```
   DATABASE_URL=file:./prod.db
   NEXTAUTH_SECRET=<your-secret>
   NEXTAUTH_URL=${{ RAILWAY_PUBLIC_DOMAIN }}
   GOOGLE_CLIENT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...
   GOOGLE_SHEET_ID=...
   ```

4. **Deploy**
   - Railway automatically deploys on push
   - Get your public URL from dashboard

5. **Run Prisma Migration** (if needed)
   - In Railway dashboard, go to project
   - Open "Deploy" logs
   - Add build command: `npx prisma migrate deploy && npm run build`

#### Optional: Add PostgreSQL on Railway

1. Click "New" → "Database" → "PostgreSQL"
2. Railway automatically sets `DATABASE_URL`
3. Update Prisma schema to use PostgreSQL (see section 2)
4. Run migrations

### 4. Render

Render offers both static sites and web services.

#### Steps:

1. **Create New Web Service**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build Command: npm install && npx prisma migrate deploy && npm run build
   Start Command: npm start
   ```

3. **Add Environment Variables**
   ```
   DATABASE_URL=<your-postgres-url>
   NEXTAUTH_SECRET=<your-secret>
   NEXTAUTH_URL=https://your-app.onrender.com
   GOOGLE_CLIENT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...
   GOOGLE_SHEET_ID=...
   ```

4. **Add PostgreSQL (Recommended)**
   - Create new PostgreSQL database on Render
   - Copy connection string to `DATABASE_URL`
   - Update Prisma schema (see section 2)

5. **Deploy**
   - Render automatically deploys on push

### 5. Self-Hosted (VPS/Cloud Server)

Deploy on your own server (AWS EC2, DigitalOcean, etc.).

#### Steps:

1. **Set up Node.js on Server**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd alwar
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Environment Variables**
   ```bash
   nano .env
   # Add all environment variables
   ```

5. **Run Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

6. **Build Application**
   ```bash
   npm run build
   ```

7. **Start with PM2** (recommended)
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "drona-tracker" -- start
   pm2 save
   pm2 startup
   ```

8. **Set up Nginx Reverse Proxy** (optional)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Migration (SQLite to PostgreSQL)

If you need to migrate from SQLite to PostgreSQL:

1. **Export SQLite Data**
   ```bash
   npx prisma studio
   # Manually export data or use sqlite3 .dump
   ```

2. **Update Prisma Schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Create New Migration**
   ```bash
   npx prisma migrate dev --name postgresql_migration
   ```

4. **Import Data to PostgreSQL**
   Use Prisma Client or manual SQL imports

## Environment Variable Best Practices

### Generate Secure NEXTAUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Format GOOGLE_PRIVATE_KEY

For environment variables, ensure the private key has `\n` for newlines:
```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkq...\n-----END PRIVATE KEY-----"
```

## Post-Deployment Checklist

- [ ] Verify deployment URL is accessible
- [ ] Test login page loads
- [ ] Create first user via API
- [ ] Log in successfully
- [ ] Create a test record (pending)
- [ ] Submit record (test completion and counter)
- [ ] Verify Google Sheets sync (if configured)
- [ ] Test on mobile device
- [ ] Set up custom domain (optional)
- [ ] Configure SSL/HTTPS (usually automatic)
- [ ] Set up monitoring/logging

## Troubleshooting

### Build Failures

**Error**: "Cannot find module '@prisma/client'"
```bash
# Solution: Add to build command
npx prisma generate && npm run build
```

**Error**: Database connection issues
```bash
# Solution: Verify DATABASE_URL is correct
# Run: npx prisma db push
```

### Runtime Errors

**Error**: NextAuth configuration error
- Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your deployment URL

**Error**: Google Sheets sync fails
- Verify all three Google variables are set
- Check service account has access to the sheet
- Review private key format (with `\n` characters)

### Performance Issues

- Enable output caching in Next.js
- Use PostgreSQL instead of SQLite for production
- Deploy to regions close to your users
- Enable Vercel Edge Network or similar CDN

## Monitoring

### Recommended Tools

- **Vercel Analytics** (built-in for Vercel)
- **Sentry** (error tracking)
- **LogRocket** (session replay)
- **Uptime Robot** (uptime monitoring)

## Backup Strategy

### SQLite (if used)
```bash
# Backup database file
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# Automate with cron (Linux)
0 0 * * * cp /path/to/app/prisma/dev.db /path/to/backups/db-$(date +\%Y\%m\%d).db
```

### PostgreSQL
```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Automated backups (most providers include this)
```

### Google Sheets
Google Sheets acts as a secondary backup for completed records.

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review application logs
3. Test locally first: `npm run build && npm start`
4. Consult the main [README.md](README.md)

Happy deploying! 🚀

