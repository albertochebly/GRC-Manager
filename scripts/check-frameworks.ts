import { db } from '../server/db';
import { frameworks, organizationFrameworks } from '../shared/schema';

async function checkFrameworks() {
  try {
    console.log('All frameworks:');
    const allFrameworks = await db.select().from(frameworks);
    console.table(allFrameworks);
    
    console.log('\nAll organization frameworks:');
    const orgFrameworks = await db.select().from(organizationFrameworks);
    console.table(orgFrameworks);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFrameworks();
