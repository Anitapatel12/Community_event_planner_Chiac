const prismaClient = require('@prisma/client');
const { PrismaClient } = prismaClient;

const prisma = new PrismaClient();  
module.exports = prisma;