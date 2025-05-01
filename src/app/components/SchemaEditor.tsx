import React from 'react';
import MonacoEditor from '@monaco-editor/react';

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const SchemaEditor: React.FC<SchemaEditorProps> = ({ value, onChange, error }) => {
  return (
    <div className="border border-slate-300 rounded-md overflow-hidden">
      <MonacoEditor
        height="200px"
        language="json"
        theme="vs-light"
        value={value}
        onChange={(value) => onChange(value || '')}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
      {error && (
        <div className="p-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default SchemaEditor;