# Medical Anatomy AI - 3D Visualization & Symptom Analysis

A sophisticated web application that combines interactive 3D anatomical visualization with AI-powered symptom analysis. Users can describe their symptoms, and the app analyzes them to identify possible conditions while highlighting affected organs on a 3D body model.

## 🎯 Key Features

### 1. **Interactive 3D Anatomy Visualization**
- Full-body 3D model built with React Three Fiber
- Color-coded organ system visualization
- Real-time highlighting of affected organs based on AI analysis
- Smooth rotation and interaction controls

### 2. **AI-Powered Symptom Analysis**
- Intelligent symptom interpretation using OpenAI's GPT-4o
- Identifies possible medical conditions with likelihood levels (HIGH/MEDIUM/LOW)
- Provides detailed descriptions of each condition
- Calculates severity scores (0-100)
- Offers personalized recommendations

### 3. **Medical History Tracking**
- Stores analysis results with Neon PostgreSQL
- User authentication with Better Auth
- Historical record of all previous symptom analyses
- Easy reference for tracking health patterns

### 4. **Safety & Compliance**
- Clear medical disclaimer on all pages
- Educational-only purpose messaging
- Recommendations to consult healthcare professionals
- Emergency guidance when severity warrants

## 📋 Requirements Setup

### Environment Variables
```env
DATABASE_URL=your_neon_postgres_url
BETTER_AUTH_SECRET=your_auth_secret (generate with: openssl rand -base64 32)
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key (optional - uses demo mode if not set)
```

### Get the AI_GATEWAY_API_KEY
1. Go to [Vercel AI Gateway](https://console.vercel.com/integrations/ai-gateway)
2. Connect your account
3. Copy the API key
4. Add it to your project's environment variables in Settings > Vars

## 🚀 Getting Started

### Installation
```bash
# Install dependencies
pnpm install

# Set up environment variables
# Edit .env.local with your DATABASE_URL and BETTER_AUTH_SECRET

# Start development server
pnpm dev
```

### Access Points
- **Demo Mode**: `/demo` - No authentication required, works with mock AI responses
- **Authenticated**: `/` - Full app with user accounts and medical history
- **Sign Up**: `/sign-up` - Create a new account
- **Sign In**: `/sign-in` - Login to existing account

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 with React 19
- **3D Graphics**: React Three Fiber + Three.js
- **Database**: Neon PostgreSQL
- **Authentication**: Better Auth (email + password)
- **AI**: Vercel AI SDK with OpenAI GPT-4o
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **ORM**: Drizzle ORM

### Component Structure
```
app/
├── page.tsx              # Protected dashboard
├── demo/page.tsx         # Demo mode (no auth required)
├── sign-in/page.tsx      # Sign-in page
├── sign-up/page.tsx      # Sign-up page
├── api/
│   ├── analyze-symptoms/ # AI analysis endpoint
│   └── medical-history/  # Get user's history
└── actions/
    └── medical.ts        # Server actions for DB operations

components/
├── body-model.tsx        # 3D body visualization
├── dashboard.tsx         # Main dashboard layout
├── symptom-input.tsx     # Symptom form
├── analysis-results.tsx  # Results display
└── medical-history.tsx   # History viewer
```

### Database Schema
```sql
user              -- Better Auth users
session           -- Better Auth sessions  
account           -- Better Auth accounts
verification      -- Better Auth verification
medical_history   -- User symptom analyses
  ├── userId
  ├── symptoms
  ├── detectedConditions (JSON)
  ├── affectedOrgans (JSON)
  ├── severityScore
  └── createdAt
```

## 🎮 How to Use

### Step 1: Enter Symptoms
1. Go to the "Symptom Analysis" tab
2. Describe your symptoms in detail
3. Use quick templates or type custom symptoms
4. Optionally add additional notes

### Step 2: AI Analysis
1. Click "Analyze Symptoms"
2. Wait for AI processing (a few seconds)
3. Review possible conditions with likelihood levels

### Step 3: View 3D Visualization
1. Switch to "Results & Visualization" tab
2. See which organs are affected
3. Review severity score
4. Read personalized recommendations

### Step 4: Track History
1. Go to "History" tab
2. View all past analyses
3. Track health patterns over time

## ⚙️ Configuration

### Customizing the 3D Model
Edit `components/body-model.tsx` to:
- Change organ colors
- Adjust model size/rotation
- Modify highlight effects
- Add new organs or systems

### Modifying AI Analysis
Edit `app/api/analyze-symptoms/route.ts` to:
- Change the AI model (currently GPT-4o)
- Adjust analysis schema
- Modify system prompt
- Add new condition types

### Theming
The app uses Tailwind CSS v4 with semantic design tokens. Edit `app/globals.css` to customize colors, fonts, and spacing.

## 🔒 Security Notes

- All queries to the medical_history table are scoped by userId
- Better Auth manages password hashing and session security
- Environment variables are required for production
- The demo mode uses mock data and should not store real data

## ⚠️ Important Disclaimers

**This application is for educational purposes only and should NOT be used for:**
- Actual medical diagnosis
- Treatment decisions
- Emergency medical guidance
- Replacing professional healthcare

**Always:**
- Consult qualified healthcare professionals
- Seek immediate medical attention for emergencies
- Keep medical records with your doctor
- Use this as an educational tool only

## 🐛 Troubleshooting

### "Invalid origin" error during sign-up
- Check that `BETTER_AUTH_SECRET` is set correctly
- Verify DATABASE_URL is valid
- Restart the dev server

### 3D model not rendering
- Ensure Three.js is loaded properly
- Check browser console for WebGL errors
- Try a different browser if issues persist

### AI analysis failing
- Verify `AI_GATEWAY_API_KEY` is set
- Check network connection
- Try the demo mode with mock responses

### Database errors
- Verify DATABASE_URL is correct
- Check Neon database is running
- Ensure all tables were created (check via Neon console)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)
- [shadcn/ui](https://ui.shadcn.com)

## 📄 License

Educational project - use responsibly and ethically.

---

**Last Updated**: July 2026
**Status**: Production Ready
