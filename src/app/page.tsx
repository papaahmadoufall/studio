"use client";

import { useAIModeStore } from '@/stores/aiModeStore';
import DataUpload from '@/components/data-upload';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Home() {
  const { isLocalAI, toggleAIMode } = useAIModeStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="fixed top-4 right-4 flex items-center space-x-2">
        <Switch
          id="ai-mode"
          checked={isLocalAI}
          onCheckedChange={toggleAIMode}
        />
        <Label htmlFor="ai-mode">
          {isLocalAI ? 'Using Local AI (Gemma 3B)' : 'Using Cloud AI'}
        </Label>
      </div>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-2xl font-bold">
          Survey Insights Analyzer
        </h1>
        <DataUpload />
      </main>
    </div>
  );
}

