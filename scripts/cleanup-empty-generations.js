/**
 * Database cleanup script to remove ai_generation rows with empty aiResponse
 * This script will delete rows where aiResponse is empty, null, or just whitespace
 */

import { db } from '../lib/db/index.js';
import { aiGeneration } from '../lib/db/schema.js';
import { sql, or, eq } from 'drizzle-orm';

async function cleanupEmptyGenerations() {
	console.log('🧹 Starting database cleanup for empty AI generations...');

	try {
		// First, let's count how many rows have empty aiResponse
		const emptyRows = await db
			.select({
				count: sql`count(*)`.mapWith(Number),
			})
			.from(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					eq(aiGeneration.aiResponse, null),
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			);

		const count = emptyRows[0]?.count || 0;
		console.log(`📊 Found ${count} rows with empty aiResponse`);

		if (count === 0) {
			console.log('✅ No empty rows found. Database is already clean!');
			return;
		}

		// Show some examples of what will be deleted (first 5 rows)
		const examples = await db
			.select({
				id: aiGeneration.id,
				userId: aiGeneration.userId,
				userPrompt: aiGeneration.userPrompt,
				aiResponse: aiGeneration.aiResponse,
				createdAt: aiGeneration.createdAt,
			})
			.from(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					eq(aiGeneration.aiResponse, null),
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			)
			.limit(5);

		console.log('\n🔍 Example rows that will be deleted:');
		examples.forEach((row, index) => {
			console.log(`${index + 1}. ID: ${row.id}`);
			console.log(`   User: ${row.userId}`);
			console.log(`   Prompt: ${row.userPrompt?.substring(0, 100)}...`);
			console.log(`   Response: "${row.aiResponse}"`);
			console.log(`   Created: ${row.createdAt}`);
			console.log('');
		});

		// Ask for confirmation in production
		if (process.env.NODE_ENV === 'production') {
			console.log('⚠️  This will permanently delete rows from the database.');
			console.log(
				'   To proceed, run: NODE_ENV=development node scripts/cleanup-empty-generations.js',
			);
			return;
		}

		// Perform the deletion
		console.log('🗑️  Deleting empty rows...');
		const result = await db
			.delete(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					eq(aiGeneration.aiResponse, null),
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			);

		console.log(
			`✅ Successfully deleted ${
				result.rowCount || count
			} rows with empty aiResponse`,
		);

		// Show final count
		const finalCount = await db
			.select({
				count: sql`count(*)`.mapWith(Number),
			})
			.from(aiGeneration);

		console.log(
			`📈 Remaining ai_generation rows: ${finalCount[0]?.count || 0}`,
		);
		console.log('🎉 Database cleanup completed successfully!');
	} catch (error) {
		console.error('❌ Error during cleanup:', error);
		throw error;
	}
}

// Run the cleanup
cleanupEmptyGenerations()
	.then(() => {
		console.log('🏁 Cleanup script finished');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Cleanup script failed:', error);
		process.exit(1);
	});
