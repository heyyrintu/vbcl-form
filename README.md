# VBCL Alwar Production Tracker

A modern, mobile-friendly ERP-style web application for managing production records with automatic monthly vehicle counting and Google Sheets synchronization.

## Features

- 🔐 **Secure Authentication** - Username/password based authentication with NextAuth.js
- 📝 **Form Management** - Create and edit production entries with comprehensive form fields
- 🔄 **Workflow States** - Pending and Completed states with automatic monthly counters
- 📊 **Google Sheets Sync** - Automatic synchronization of completed entries to Google Sheets
- 📱 **Mobile-First Design** - Responsive UI optimized for mobile and desktop
- ⚡ **Fast & Modern** - Built with Next.js 15, React 19, and TypeScript

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (credentials-based)
- **Google Sheets**: googleapis package
- **Deployment**: Flexible (Vercel, Railway, Render compatible)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository** (or create from template)

```bash
git clone <your-repo-url>
cd alwar
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the `.env.example` file to `.env`:

```bash
# On Windows PowerShell
Copy-Item .env.example .env

# On Linux/Mac
cp .env.example .env
```

Then update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth - Generate a secure secret for production
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Google Sheets API (see setup guide below)
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID="your-google-sheet-id"
```

4. **Initialize the database**

The database is already set up with migrations. If you need to reset or regenerate:

```bash
npx prisma migrate dev
```

5. **Create your first user**

Use the registration API to create an admin user:

```bash
# Using curl (Git Bash/Linux/Mac)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password"}'

# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"your-secure-password"}'
```

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Sheets Integration Setup

To enable Google Sheets synchronization, follow these steps:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `drona-production-tracker` (or any name)
   - Click "Create and Continue"
   - Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. Click on the newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 4. Configure Environment Variables

Open the downloaded JSON file and extract:

- `client_email` → Copy to `GOOGLE_CLIENT_EMAIL` in `.env`
- `private_key` → Copy to `GOOGLE_PRIVATE_KEY` in `.env` (keep the `\n` characters)

### 5. Create and Share Google Sheet

1. Create a new Google Sheet
2. Copy the Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Copy the `SHEET_ID` part
   - Paste it as `GOOGLE_SHEET_ID` in `.env`
3. **Important**: Share the sheet with your service account email:
   - Click "Share" in your Google Sheet
   - Add the `GOOGLE_CLIENT_EMAIL` as an editor
   - Send the invite

### 6. Restart Your Application

After configuring the environment variables, restart your development server:

```bash
npm run dev
```

Now when you submit (complete) an entry, it will automatically sync to your Google Sheet!

## Usage

### Logging In

1. Navigate to `/login`
2. Enter your username and password
3. You'll be redirected to the dashboard

### Creating a New Entry

1. Click the "New Entry" button
2. Fill in all required fields:
   - Drona Supervisor (required)
   - Shift (Day/Night)
   - Bin No (required)
   - Model No (required)
   - Chassis No (required)
   - Type (PTS/PDI)
   - Manpower details (optional)
   - Remarks (optional)
3. Choose an action:
   - **Save**: Saves as Pending (editable)
   - **Submit**: Marks as Completed (assigns vehicle count, syncs to Google Sheets)

### Managing Records

**Pending Records**:
- Click "Edit" to modify and resubmit
- Use "Save" to keep as Pending
- Use "Submit" to mark as Completed

**Completed Records**:
- View-only by default
- Click "Cancel" to move back to Pending for editing
- Monthly vehicle counter is preserved (not reassigned)

### Monthly Vehicle Counter

- Automatically increments for each Completed entry
- Resets to 1 at the start of each month
- Assigned only when an entry is Submitted (moved to Completed)
- Displayed as "Sr No / Vehicle Count" in the UI

## Database Schema

### User Model
- `id`: Unique identifier
- `username`: Unique username
- `password`: Hashed password
- `createdAt`, `updatedAt`: Timestamps

### Record Model
- `id`: Unique identifier
- `status`: "PENDING" or "COMPLETED"
- `dronaSupervisor`: Supervisor name
- `shift`: "Day Shift" or "Night Shift"
- `srNoVehicleCount`: Monthly counter (null until completed)
- `binNo`, `modelNo`, `chassisNo`: Vehicle details
- `type`: "PTS" or "PDI"
- `electrician`, `fitter`, `painter`, `helper`, `productionInchargeFromVBCL`: Manpower counts
- `remarks`: Optional notes
- `completedAt`: Timestamp when completed (for monthly counting)
- `createdAt`, `updatedAt`: Timestamps

## Deployment

### Vercel (Recommended for Next.js)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy!

**Note**: For SQLite in production, consider migrating to PostgreSQL:
- Update `prisma/schema.prisma` datasource to `postgresql`
- Update `DATABASE_URL` in environment variables
- Run `npx prisma migrate dev` to create new migrations

### Railway / Render

1. Create a new project
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

## Project Structure

```
/app
  /api
    /auth
      /[...nextauth]       # NextAuth API routes
      /register           # User registration
    /records              # Record CRUD operations
  /dashboard              # Main dashboard page
  /login                  # Login page
  layout.tsx              # Root layout
  page.tsx                # Home (redirects to dashboard)
  globals.css             # Global styles

/components
  LoginForm.tsx           # Login form component
  RecordForm.tsx          # Record creation/edit form
  RecordCard.tsx          # Individual record display
  RecordList.tsx          # List of records

/lib
  auth.ts                 # NextAuth configuration
  db.ts                   # Prisma client
  googleSheets.ts         # Google Sheets integration
  utils.ts                # Utility functions

/prisma
  schema.prisma           # Database schema
  /migrations             # Database migrations

middleware.ts             # Auth middleware
```

## Development

### Running Database Migrations

```bash
npx prisma migrate dev --name migration_name
```

### Viewing Database

```bash
npx prisma studio
```

### Adding New Users

POST to `/api/auth/register` with:
```json
{
  "username": "newuser",
  "password": "securepassword"
}
```

## Troubleshooting

### Google Sheets Sync Fails

1. Verify service account credentials in `.env`
2. Ensure the Google Sheet is shared with the service account email
3. Check that Google Sheets API is enabled in Google Cloud Console
4. Restart the application after updating environment variables

### Authentication Issues

1. Verify `NEXTAUTH_SECRET` is set in `.env`
2. Check that `NEXTAUTH_URL` matches your deployment URL
3. Clear browser cookies and try again

### Database Issues

1. Delete `dev.db` and `prisma/migrations` folder
2. Run `npx prisma migrate dev` to recreate
3. Create a new user via the registration endpoint

## Security Notes

- **Change `NEXTAUTH_SECRET`** to a secure random string in production
- **Never commit** `.env` file to version control (already in `.gitignore`)
- **Use strong passwords** for all user accounts
- **Keep service account keys** secure and never expose them publicly

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.
