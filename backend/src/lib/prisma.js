// backend/src/lib/prisma.js
// One shared PrismaClient for the whole process (each client opens its own
// connection pool, so creating one per route file exhausts Postgres quickly).

const { PrismaClient } = require('@prisma/client');

const prisma = global.__creddualPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__creddualPrisma = prisma;

module.exports = prisma;
