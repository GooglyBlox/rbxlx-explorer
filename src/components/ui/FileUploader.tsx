import React, { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface FileUploaderProps {
  onFileUploaded: (content: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUploaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.name.endsWith(".rbxlx") || file.name.endsWith(".xml")) {
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          onFileUploaded(event.target.result);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid .rbxlx or .xml file");
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearFile = () => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {fileName ? (
        <div className="flex items-center justify-between p-3 border border-blue-600 rounded bg-[#1a2537]">
          <span className="truncate">{fileName}</span>
          <button
            onClick={clearFile}
            className="p-1 rounded-full hover:bg-gray-700"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-[#172035]"
              : "border-gray-700 hover:border-gray-500 hover:bg-[#151515]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload className="mx-auto h-12 w-12 text-blue-500 mb-2" />
          <p className="text-lg font-medium mb-2">
            Drop your RBXLX file here
          </p>
          <p className="text-sm text-gray-400">
            or click to browse files (.rbxlx, .xml)
          </p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".rbxlx,.xml"
        className="hidden"
      />
    </div>
  );
}

export default FileUploader;