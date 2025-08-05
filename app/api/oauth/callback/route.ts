import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const code = searchParams.get('code');
		const state = searchParams.get('state');

		if (!code) {
			return new Response('Authorization code not found', { status: 400 });
		}

		// In a full implementation, you would:
		// 1. Exchange the code for an access token
		// 2. Store the token securely for the user
		// 3. Use the token for subsequent Netlify API calls

		// For now, just redirect back to the main page
		redirect('/?oauth=success');
	} catch (error) {
		console.error('OAuth callback error:', error);
		redirect('/?oauth=error');
	}
}
