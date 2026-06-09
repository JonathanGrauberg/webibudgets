const { PrismaClient } = require('@prisma/client');

async function main(){
  const prisma = new PrismaClient();
  try{
    const res = await prisma.$queryRaw`SELECT migration_name, started_at, finished_at, checksum FROM "_prisma_migrations" ORDER BY started_at`;
    console.log(JSON.stringify(res, null, 2));
  }catch(e){
    console.error('Query error', e);
    process.exitCode = 1;
  }finally{
    await prisma.$disconnect();
  }
}

main();
