import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { aiGeneration } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { GenerationCard } from "@/components/generation-card";

async function getGenerations(userId: string) {
  return await db
    .select()
    .from(aiGeneration)
    .where(eq(aiGeneration.userId, userId))
    .orderBy(desc(aiGeneration.createdAt));
}

export default async function GenerationsPage() {
  // Get the authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  // Fetch user's AI generations
  const generations = await getGenerations(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Your AI Generations</h1>

      {generations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No generations yet</p>
          <p className="text-gray-400 mt-2">
            Start creating websites to see them here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {generations.map((generation) => (
            <GenerationCard key={generation.id} generation={generation} />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-gray-500">Total generations: {generations.length}</p>
      </div>
    </div>
  );
}
