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
