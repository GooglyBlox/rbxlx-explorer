import React from "react";
import { Editor } from "@monaco-editor/react";

interface ScriptEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  content,
  onChange,
}) => {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="lua"
        value={content}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default ScriptEditor;
