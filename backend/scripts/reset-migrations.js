// Reset failed migrations from database
const { Client } = require('pg');

async function resetMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔄 Resetting failed migrations...');
    
    // Drop the migrations table
    await client.query('DROP TABLE IF EXISTS "_prisma_migrations" CASCADE');
    
    console.log('✅ Migration table reset successfully!');
  } catch (error) {
    console.error('❌ Error resetting migrations:', error.message);
    // Don't throw error, let the process continue
  } finally {
    await client.end();
  }
}

resetMigrations();

