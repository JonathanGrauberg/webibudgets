const { PrismaClient } = require('@prisma/client');

async function main(){
  const prisma = new PrismaClient();
  try{
    const cols = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Tenant'
      ORDER BY ordinal_position
    `;
    console.log(JSON.stringify(cols, null, 2));
  }catch(e){
    console.error('Query error', e);
    process.exitCode = 1;
  }finally{
    await prisma.$disconnect();
  }
}

main();
