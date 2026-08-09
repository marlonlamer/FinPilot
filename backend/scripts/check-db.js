const prisma = require('../src/prisma/client');

(async () => {
  try {
    await prisma.$connect();
    console.log('connected');
    const count = await prisma.user.count();
    console.log('users', count);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
