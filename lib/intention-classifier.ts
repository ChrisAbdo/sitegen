import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export type UserIntention =
	| 'generate'
	| 'deploy'
	| 'both'
	| 'download'
	| 'edit';

const classificationPrompt = `You are an AI that classifies user intentions for a website generator.

Analyze the user's message and classify it into ONE of these categories:

1. "generate" - User wants to create/generate a new website or page
   Examples: "create a website", "build me a landing page", "make a portfolio site"

2. "deploy" - User wants to deploy/publish an existing website
   Examples: "deploy this", "publish my site", "make it live", "host this website"

3. "both" - User wants to generate AND deploy in one action
   Examples: "create and deploy a site", "build and publish a website", "make a live website"

4. "download" - User wants to download the HTML file
   Examples: "download this", "save as file", "give me the HTML", "export the code"

5. "edit" - User wants to modify/edit existing content
   Examples: "change the color", "add a section", "modify the header", "update the text"

Respond with ONLY the category name (generate, deploy, both, download, or edit). No explanations.`;

export async function classifyUserIntention(
	message: string,
): Promise<UserIntention> {
	try {
		const result = await generateText({
			model: google('gemini-2.5-flash'),
			system: classificationPrompt,
			prompt: message,
			temperature: 0, // Use low temperature for consistent classification
		});

		const intention = result.text.trim().toLowerCase() as UserIntention;

		// Validate the result
		const validIntentions: UserIntention[] = [
			'generate',
			'deploy',
			'both',
			'download',
			'edit',
		];
		if (validIntentions.includes(intention)) {
			return intention;
		}

		// Default fallback
		return 'generate';
	} catch (error) {
		console.error('Error classifying user intention:', error);
		return 'generate'; // Default fallback
	}
}
