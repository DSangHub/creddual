cd backend
npm init -y
npm install express cors helmet express-rate-limit dotenv bcryptjs jsonwebtoken @prisma/client prisma
npx prisma init
npx prisma generate
npx prisma migrate dev --name init
npm startcd frontend
npx create-react-app .
npm install axios react-router-dom lucide-react tailwindcss
npm start
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
# 1. Build the project locally (verify it works)
cd frontend
npm run build

# 2. Test the build
npx serve -s build

# 3. Deploy to Vercel
npx vercel --prod

# Or using Vercel CLI after login
vercel --prod

# If you have issues, deploy with force
vercel --prod --force# Frontend
cd frontend
npm install
npm run build
vercel --prod

# Backend (separate Vercel project)
cd backend
vercel --prod
