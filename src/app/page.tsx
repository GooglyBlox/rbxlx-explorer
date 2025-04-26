/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  parseRBXLX,
  exportToRBXLX,
  updatePropertyInRaw,
  updateScriptInRaw,
  updateNodeInTree,
  getNodePath,
} from "@/lib/parser";
import { TreeNode, ParsedRBXLX } from "@/types/rbxlx";
import FileUploader from "@/components/ui/FileUploader";
import TreeView from "@/components/ui/TreeView";
import PropertyEditor from "@/components/ui/PropertyEditor";
import ScriptEditor from "@/components/ui/ScriptEditor";
import { Save, Code, List, Settings, Check, AlertTriangle } from "lucide-react";

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedRBXLX | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [scriptContent, setScriptContent] = useState<string>("");
  const [modified, setModified] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleFileUploaded = (content: string) => {
    try {
      const parsed = parseRBXLX(content);
      setParsedData(parsed);
      setSelectedNode(null);
      setScriptContent("");
      setModified(false);

      setStatusMessage({
        type: "success",
        text: "File loaded successfully",
      });
    } catch (error) {
      console.error("Error parsing RBXLX file:", error);

      setStatusMessage({
        type: "error",
        text: "Error parsing the file. Please ensure it is a valid RBXLX file.",
      });
    }
  };

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
    if (node.isScript && node.content) {
      setScriptContent(node.content);
    } else {
      setScriptContent("");
    }
  };

  const handlePropertyChange = (name: string, value: any) => {
    if (!selectedNode || !parsedData) return;

    try {
      const property = selectedNode.properties?.find((p) => p.name === name);
      if (!property || !property.path) return;

      const nodePath = getNodePath(parsedData.tree, selectedNode.id);

      const updatedRaw = updatePropertyInRaw(
        parsedData.raw,
        nodePath,
        property.path,
        value
      );

      const updatedTree = updateNodeInTree(
        parsedData.tree,
        nodePath,
        (node) => {
          const updatedNode = { ...node };

          if (updatedNode.properties) {
            const propIndex = updatedNode.properties.findIndex(
              (p) => p.name === name
            );
            if (propIndex !== -1) {
              updatedNode.properties[propIndex] = {
                ...updatedNode.properties[propIndex],
                value,
              };
            }
          }

          return updatedNode;
        }
      );

      setParsedData({
        raw: updatedRaw,
        tree: updatedTree,
      });

      const updatedSelectedNode = {
        ...selectedNode,
        properties: selectedNode.properties?.map((p) =>
          p.name === name ? { ...p, value } : p
        ),
      };

      setSelectedNode(updatedSelectedNode);
      setModified(true);
    } catch (error) {
      console.error("Error updating property:", error);

      setStatusMessage({
        type: "error",
        text: "Error updating property",
      });
    }
  };

  const handleScriptChange = (value: string | undefined) => {
    if (value === undefined || !selectedNode || !parsedData) return;

    try {
      setScriptContent(value);

      const nodePath = getNodePath(parsedData.tree, selectedNode.id);

      const updatedRaw = updateScriptInRaw(parsedData.raw, nodePath, value);

      const updatedTree = updateNodeInTree(
        parsedData.tree,
        nodePath,
        (node) => ({
          ...node,
          content: value,
        })
      );

      setParsedData({
        raw: updatedRaw,
        tree: updatedTree,
      });

      setSelectedNode({
        ...selectedNode,
        content: value,
      });

      setModified(true);
    } catch (error) {
      console.error("Error updating script content:", error);

      setStatusMessage({
        type: "error",
        text: "Error updating script content",
      });
    }
  };

  const handleExport = () => {
    if (!parsedData) return;

    try {
      const xmlContent = exportToRBXLX({ roblox: parsedData.raw.roblox });

      const blob = new Blob([xmlContent], { type: "application/xml" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "modified.rbxlx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setModified(false);

      setStatusMessage({
        type: "success",
        text: "File exported successfully",
      });
    } catch (error) {
      console.error("Error exporting RBXLX file:", error);

      setStatusMessage({
        type: "error",
        text: "Error exporting the file",
      });
    }
  };

  return (
    <main className="flex flex-col h-screen bg-[#0f0f0f] text-white">
      <header className="bg-[#161616] border-b border-[#2a2a2a] p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative w-8 h-8 mr-3">
            <Image
              src="/studio.svg"
              alt="Studio Icon"
              width={24}
              height={24}
              className="w-8 h-8"
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            RBXLX Explorer
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {statusMessage && (
            <div
              className={`flex items-center px-3 py-1.5 rounded text-sm ${
                statusMessage.type === "success"
                  ? "bg-green-900 text-green-100"
                  : statusMessage.type === "error"
                  ? "bg-red-900 text-red-100"
                  : "bg-blue-900 text-blue-100"
              }`}
            >
              {statusMessage.type === "success" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : statusMessage.type === "error" ? (
                <AlertTriangle className="h-4 w-4 mr-2" />
              ) : null}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {modified && (
            <div className="text-yellow-300 text-sm px-2 py-1 bg-yellow-950 rounded">
              Unsaved changes
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={!parsedData}
            className={`btn px-3 py-1.5 rounded flex items-center ${
              parsedData
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-800 cursor-not-allowed opacity-50"
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </header>

      {!parsedData ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold mb-2">RBXLX Explorer</h2>
              <p className="text-gray-400">
                Upload a Roblox RBXLX file to view and edit its contents
              </p>
            </div>
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Tree View Panel */}
            <Panel defaultSize={20} minSize={15}>
              <div className="h-full flex flex-col bg-[#121212] border-r border-[#2a2a2a]">
                <div className="panel-header flex items-center">
                  <List className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Explorer</span>
                </div>
                <div className="flex-1 overflow-auto py-1">
                  <TreeView
                    nodes={parsedData.tree}
                    onSelectNode={handleNodeSelect}
                    selectedNodeId={selectedNode?.id || null}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="resize-handle" />

            {/* Details Panel */}
            <Panel>
              {selectedNode ? (
                <div className="h-full flex flex-col">
                  <div className="panel-header flex items-center justify-between">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{selectedNode.name}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-[#252525] rounded text-gray-400">
                      {selectedNode.class}
                    </span>
                  </div>

                  {selectedNode.isScript ? (
                    <div className="flex-1 overflow-hidden">
                      <PanelGroup direction="vertical">
                        <Panel defaultSize={30} minSize={10}>
                          <div className="h-full overflow-auto">
                            <PropertyEditor
                              properties={selectedNode.properties || []}
                              onPropertyChange={handlePropertyChange}
                            />
                          </div>
                        </Panel>

                        <PanelResizeHandle className="h-1 bg-[#1a1a1a]" />

                        <Panel defaultSize={70}>
                          <div className="h-full flex flex-col">
                            <div className="panel-header flex items-center">
                              <Code className="h-4 w-4 mr-2 text-yellow-500" />
                              <span>Script</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <ScriptEditor
                                content={scriptContent}
                                onChange={handleScriptChange}
                              />
                            </div>
                          </div>
                        </Panel>
                      </PanelGroup>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto">
                      <PropertyEditor
                        properties={selectedNode.properties || []}
                        onPropertyChange={handlePropertyChange}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select an item to view its properties
                </div>
              )}
            </Panel>
          </PanelGroup>
        </div>
      )}
    </main>
  );
}
