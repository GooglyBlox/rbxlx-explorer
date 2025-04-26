/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";
import { TreeNode } from "@/types/rbxlx";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Roblox Studio shows top‑level services in a fixed order. Everything not in
 * that list is sorted alphabetically afterwards.
 */
const SERVICE_PRIORITY: string[] = [
  "Workspace",
  "Players",
  "Lighting",
  "ReplicatedFirst",
  "ReplicatedStorage",
  "ServerStorage",
  "ServerScriptService",
  "StarterPlayer",
  "StarterGui",
  "StarterPack",
  "SoundService",
  "Teams",
];

const PRIORITY_MAP = SERVICE_PRIORITY.reduce<Record<string, number>>(
  (m, name, i) => {
    m[name] = i;
    return m;
  },
  {}
);

const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
  [...nodes].sort((a, b) => {
    const pa = PRIORITY_MAP[a.class] ?? Number.MAX_SAFE_INTEGER;
    const pb = PRIORITY_MAP[b.class] ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

/**
 * Icon loader: <img src="/icons/<Class>.png"> with graceful fallback to
 * File/Folder when an exact match isn’t found.
 */
const getIconForNode = (node: TreeNode) => {
  const fallback =
    node.children && node.children.length > 0
      ? "/icons/Folder.png"
      : "/icons/File.png";

  return (
    <img
      src={`/icons/${node.class}.png`}
      alt={node.class}
      className="w-4 h-4 object-contain"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (img.src !== window.location.origin + fallback) {
          img.src = fallback;
        }
      }}
    />
  );
};

/* -------------------------------------------------------------------------- */

interface TreeViewProps {
  nodes: TreeNode[];
  onSelectNode: (node: TreeNode) => void;
  selectedNodeId: string | null;
}

export const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId,
}) => {
  const sortedTree = useMemo<TreeNode[]>(() => {
    const deepSort = (list: TreeNode[]): TreeNode[] =>
      sortNodes(list).map((n) =>
        n.children ? { ...n, children: deepSort(n.children) } : n
      );

    return deepSort(nodes);
  }, [nodes]);

  return (
    <div className="p-1.5 overflow-auto">
      {sortedTree.map((n) => (
        <TreeViewNode
          key={n.id}
          node={n}
          level={0}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </div>
  );
};

interface TreeViewNodeProps {
  node: TreeNode;
  level: number;
  onSelectNode: (node: TreeNode) => void;
  selectedNodeId: string | null;
}

const TreeViewNode: React.FC<TreeViewNodeProps> = ({
  node,
  level,
  onSelectNode,
  selectedNodeId,
}) => {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handleSelect = () => onSelectNode(node);

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-1 rounded-sm cursor-pointer ${
          isSelected ? "bg-blue-800 bg-opacity-25" : "hover:bg-[#1a1a1a]"
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleSelect}
      >
        <div
          className="mr-1 w-5"
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )
          ) : (
            <span className="w-4" />
          )}
        </div>

        <div className="mr-2">{getIconForNode(node)}</div>

        <div className="flex items-center overflow-hidden">
          <span className="mr-2 truncate">{node.name}</span>
          <span className="text-xs text-gray-500 truncate">{node.class}</span>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeViewNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeView;
