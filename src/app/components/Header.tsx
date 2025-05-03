import React, { useState } from "react";
import { useTestStore } from "../store/testStore";
import { Brain, Github, Code } from "lucide-react";
import CodeViewerDrawer from "./CodeViewerDrawer";

interface HeaderProps {
  onCreateTestClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateTestClick }) => {
  const openRouterKey = useTestStore((state) => state.openRouterKey);
  const setOpenRouterKey = useTestStore((state) => state.setOpenRouterKey);

  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-white shadow px-8 py-4 flex items-center justify-between">
        <h1 className="flex items-center text-2xl font-bold text-slate-800">
          <Brain className="text-blue-500 mr-4" />
          Structured output test
        </h1>
        <input
          className="px-4 py-2 text-slate-800 border w-150"
          placeholder="Enter your openrouter key"
          type="password"
          value={openRouterKey ?? ""}
          onChange={(e) => setOpenRouterKey(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          onClick={onCreateTestClick}
          type="button"
        >
          Create New Test
        </button>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/kyashrathore/teststructuredoutput"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-700 hover:text-black"
            title="View on GitHub"
          >
            <Github className="w-6 h-6 mr-1" />
            <span className="sr-only">GitHub</span>
          </a>
          <button
            type="button"
            onClick={() => setIsCodeDrawerOpen(true)}
            className="flex items-center px-2 py-1 rounded hover:bg-gray-200 transition-colors text-gray-700"
            title="Show Code"
          >
            <Code className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Show Code</span>
          </button>
        </div>
      </header>
      <CodeViewerDrawer
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
      />
    </>
  );
};

export default Header;
