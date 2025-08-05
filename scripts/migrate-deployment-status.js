const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addDeploymentColumns() {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		// Add deployment status columns
		await pool.query(`
            ALTER TABLE ai_generation
            ADD COLUMN IF NOT EXISTS "deploymentStatus" text DEFAULT 'not_deployed' NOT NULL,
            ADD COLUMN IF NOT EXISTS "deploymentUrl" text,
            ADD COLUMN IF NOT EXISTS "deploymentId" text,
            ADD COLUMN IF NOT EXISTS "deployedAt" timestamp
        `);

		console.log('✅ Successfully added deployment status columns!');
	} catch (error) {
		console.error('❌ Migration error:', error);
	} finally {
		await pool.end();
	}
}

addDeploymentColumns();
