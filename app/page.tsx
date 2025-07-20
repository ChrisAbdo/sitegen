"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { AuthButton } from "@/components/auth-button";
import { LivePreview } from "@/components/live-preview";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  const { data: session, isPending } = useSession();

  // Extract the most recent AI response for preview
  const getLatestAIResponse = () => {
    const aiMessages = messages.filter((m) => m.role === "assistant");
    if (aiMessages.length === 0) return "";

    const latestMessage = aiMessages[aiMessages.length - 1];
    return latestMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  const latestAIResponse = getLatestAIResponse();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with auth */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <h1 className="text-xl font-semibold">AI Website Generator</h1>
          <AuthButton />
        </div>
      </header>

      <main className="h-[calc(100vh-3.5rem)]">
        {isPending ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !session?.user ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="mb-4 text-2xl font-bold">
              Welcome to AI Website Generator
            </h2>
            <p className="mb-8 text-muted-foreground">
              Sign in with GitHub to start generating websites with AI
            </p>
            <AuthButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Left Side - Chat Interface */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Welcome back, <strong>{session.user.name}</strong>! Describe
                  the website you want to create.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Start Creating!
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Describe the website you want to build and I'll generate
                        the HTML for you.
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Example: "Create a landing page for my restaurant with a
                        menu section"
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              return (
                                <div
                                  key={`${message.id}-${i}`}
                                  className="whitespace-pre-wrap text-sm"
                                >
                                  {part.text}
                                </div>
                              );
                          }
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!input.trim()) return;
                  sendMessage({ text: input });
                  setInput("");
                }}
                className="p-4 border-t bg-background/95"
              >
                <div className="flex space-x-2">
                  <input
                    className="flex-1 rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    value={input}
                    placeholder="Describe the website you want to create..."
                    onChange={(e) => setInput(e.currentTarget.value)}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side - Live Preview */}
            <div className="flex flex-col">
              <div className="p-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Live Preview</h2>
                <p className="text-xs text-muted-foreground">
                  Your generated website will appear here
                </p>
              </div>

              <div className="flex-1 overflow-hidden">
                {latestAIResponse ? (
                  <div className="h-full">
                    <LivePreview
                      htmlContent={latestAIResponse}
                      generationId="preview"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        No Website Generated Yet
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Start a conversation to generate your first website
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
