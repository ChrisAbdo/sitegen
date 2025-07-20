"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { AuthButton } from "@/components/auth-button";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  const { data: session, isPending } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with auth */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <AuthButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !session?.user ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="mb-4 text-2xl font-bold">Welcome to AI Chat</h2>
            <p className="mb-8 text-muted-foreground">
              Sign in with GitHub to start chatting with AI
            </p>
            <AuthButton />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Welcome back, <strong>{session.user.name}</strong>! You can now
                chat with AI.
              </p>
            </div>

            <div className="flex flex-col space-y-4 pb-32">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
                              className="whitespace-pre-wrap"
                            >
                              {part.text}
                            </div>
                          );
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage({ text: input });
                setInput("");
              }}
              className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4"
            >
              <div className="container mx-auto max-w-2xl">
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  value={input}
                  placeholder="Type your message..."
                  onChange={(e) => setInput(e.currentTarget.value)}
                />
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
