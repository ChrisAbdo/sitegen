import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiGeneration } from '@/lib/db/schema';
import { sql, or, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
	try {
		// Add a simple auth check - you can remove this or modify as needed
		const authHeader = request.headers.get('authorization');
		if (authHeader !== 'Bearer cleanup-secret-key') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('🧹 Starting database cleanup for empty AI generations...');

		// First, count how many rows have empty aiResponse
		const emptyRows = await db
			.select({
				count: sql`count(*)`.mapWith(Number),
			})
			.from(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					sql`${aiGeneration.aiResponse} IS NULL`,
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			);

		const count = emptyRows[0]?.count || 0;
		console.log(`📊 Found ${count} rows with empty aiResponse`);

		if (count === 0) {
			return NextResponse.json({
				success: true,
				message: 'No empty rows found. Database is already clean!',
				deletedCount: 0,
			});
		}

		// Get examples of what will be deleted
		const examples = await db
			.select({
				id: aiGeneration.id,
				userId: aiGeneration.userId,
				userPrompt: aiGeneration.userPrompt,
				createdAt: aiGeneration.createdAt,
			})
			.from(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					sql`${aiGeneration.aiResponse} IS NULL`,
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			)
			.limit(5);

		// Perform the deletion
		console.log('🗑️  Deleting empty rows...');
		const result = await db
			.delete(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					sql`${aiGeneration.aiResponse} IS NULL`,
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			);

		// Get final count
		const finalCount = await db
			.select({
				count: sql`count(*)`.mapWith(Number),
			})
			.from(aiGeneration);

		console.log(`✅ Successfully deleted ${count} rows with empty aiResponse`);

		return NextResponse.json({
			success: true,
			message: 'Database cleanup completed successfully',
			deletedCount: count,
			examplesDeleted: examples,
			remainingRows: finalCount[0]?.count || 0,
		});
	} catch (error) {
		console.error('❌ Error during cleanup:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Database cleanup failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}

// GET method to just check how many empty rows exist without deleting
export async function GET() {
	try {
		const emptyRows = await db
			.select({
				count: sql`count(*)`.mapWith(Number),
			})
			.from(aiGeneration)
			.where(
				or(
					eq(aiGeneration.aiResponse, ''),
					sql`${aiGeneration.aiResponse} IS NULL`,
					sql`trim(${aiGeneration.aiResponse}) = ''`,
				),
			);

		const totalRows = await db
			.select({
				count: sql`count(*)`.mapWith(Number),
			})
			.from(aiGeneration);

		return NextResponse.json({
			emptyRows: emptyRows[0]?.count || 0,
			totalRows: totalRows[0]?.count || 0,
			needsCleanup: (emptyRows[0]?.count || 0) > 0,
		});
	} catch (error) {
		console.error('❌ Error checking database:', error);
		return NextResponse.json(
			{
				error: 'Failed to check database',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		);
	}
}
