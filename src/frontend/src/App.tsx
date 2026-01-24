import { useState } from "react";
import { ChatPlayground } from "@/components/chat-playground";
import { RedVsBlue } from "@/game/RedVsBlue";
import { Button } from "@/components/ui/button";

type Tab = "chat" | "game";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto flex gap-2 p-2">
          <Button
            variant={activeTab === "chat" ? "default" : "outline"}
            onClick={() => setActiveTab("chat")}
          >
            Chat Playground
          </Button>
          <Button
            variant={activeTab === "game" ? "default" : "outline"}
            onClick={() => setActiveTab("game")}
          >
            Red vs Blue Game
          </Button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "chat" && <ChatPlayground />}
        {activeTab === "game" && <RedVsBlue />}
      </div>
    </div>
  );
}

export default App;
