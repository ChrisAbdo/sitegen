"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { AuthButton } from "@/components/auth-button";
import { LivePreview } from "@/components/live-preview";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function ChatComponent() {
  const [input, setInput] = useState("");
  const router = useRouter();
  
  // Get conversation ID from URL
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setConversationId(urlParams.get("c"));
  }, []);

  const [messages, setMessages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom message sending function that handles conversations
  const sendMessage = async (input: { text: string }) => {
    if (isGenerating) return;

    setIsGenerating(true);

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ type: "text", text: input.text }],
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check for new conversation ID in response headers
      const newConversationId = response.headers.get("X-Conversation-ID");
      if (newConversationId && !conversationId) {
        router.push(`/?c=${newConversationId}`, { scroll: false });
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      let fullResponse = "";
      
      // Create AI message with empty text
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      };
      
      // Add empty AI message to show streaming
      setMessages((prev) => [...prev, aiMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text-delta' && data.delta) {
                  fullResponse += data.delta;
                  
                  // Update the AI message in real-time
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === aiMessage.id 
                        ? { ...msg, parts: [{ type: "text", text: fullResponse }] }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Sorry, there was an error generating your website. Please try again.",
          },
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsGenerating(false);
  };

  const { data: session, isPending } = useSession();
  const [conversationTitle, setConversationTitle] = useState("");

  // Load conversation details if we have a conversation ID
  useEffect(() => {
    if (conversationId && session?.user) {
      fetch(`/api/conversations/${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            setConversationTitle(data.title);
          }
        })
        .catch(console.error);
    }
  }, [conversationId, session]);

  // Extract the most recent AI response for preview
  const getLatestAIResponse = () => {
    const aiMessages = messages.filter((m: any) => m.role === "assistant");
    if (aiMessages.length === 0) return "";

    const latestMessage = aiMessages[aiMessages.length - 1];
    return latestMessage.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  };

  const latestAIResponse = getLatestAIResponse();

  const handleNewConversation = () => {
    router.push("/");
    window.location.reload(); // Simple refresh to clear state
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with auth */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">AI Website Generator</h1>
            {conversationTitle && (
              <span className="text-sm text-muted-foreground">
                • {conversationTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {conversationId && (
              <button
                onClick={handleNewConversation}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Conversation
              </button>
            )}
            <AuthButton />
          </div>
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
                  Welcome back, <strong>{session.user.name}</strong>!
                  {conversationId
                    ? " Continue editing your website."
                    : " Describe the website you want to create."}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {conversationId
                          ? "Continue Editing"
                          : "Start Creating!"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {conversationId
                          ? "Make changes to your website by describing what you want to modify."
                          : "Describe the website you want to build and I'll generate the HTML for you."}
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        Example:{" "}
                        {conversationId
                          ? '"Change the main headline to say Your Next Gaming Adventure"'
                          : '"Create a landing page for my restaurant with a menu section"'}
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
                        {message.parts.map((part: any, i: number) => {
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
                  if (!input.trim() || isGenerating) return;
                  sendMessage({ text: input });
                  setInput("");
                }}
                className="p-4 border-t bg-background/95"
              >
                <div className="flex space-x-2">
                  <input
                    className="flex-1 rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    value={input}
                    placeholder={
                      conversationId
                        ? "Describe what you want to change..."
                        : "Describe the website you want to create..."
                    }
                    onChange={(e) => setInput(e.currentTarget.value)}
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isGenerating}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating
                      ? "..."
                      : conversationId
                      ? "Edit"
                      : "Generate"}
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
                        {conversationId
                          ? "Loading Website..."
                          : "No Website Generated Yet"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {conversationId
                          ? "Your website will appear here once loaded"
                          : "Start a conversation to generate your first website"}
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

export default function Chat() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ChatComponent />
    </Suspense>
  );
}
