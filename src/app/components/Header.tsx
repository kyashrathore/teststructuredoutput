import React from "react";

interface HeaderProps {
  onCreateTestClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateTestClick }) => (
  <header className="w-full bg-white shadow px-8 py-4 flex items-center justify-between">
    <h1 className="text-2xl font-bold text-slate-800">AI Model Stress Test</h1>
    <button
      className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
      onClick={onCreateTestClick}
      type="button"
    >
      Create New Test
    </button>
  </header>
);

export default Header;
