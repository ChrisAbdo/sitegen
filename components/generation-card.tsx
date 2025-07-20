"use client";

import { AiGeneration } from "@/lib/db/schema";
import { LivePreview } from "./live-preview";

interface GenerationCardProps {
  generation: AiGeneration;
}

export function GenerationCard({ generation }: GenerationCardProps) {
  const handleDownload = () => {
    const blob = new Blob([generation.aiResponse], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `website-${generation.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(generation.aiResponse);
      newWindow.document.close();
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          {generation.title && (
            <h2 className="text-xl font-semibold mb-2">{generation.title}</h2>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Model: {generation.model}</span>
            <span>Status: {generation.status}</span>
            <span>{new Date(generation.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-gray-700 mb-2">User Prompt:</h3>
          <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{generation.userPrompt}</pre>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-2">Generated Code:</h3>
          <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs">
              {generation.aiResponse}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          onClick={handleDownload}
        >
          Download HTML
        </button>

        <button
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
          onClick={handlePreview}
        >
          Preview
        </button>
      </div>

      <LivePreview
        htmlContent={generation.aiResponse}
        generationId={generation.id}
      />
    </div>
  );
}
