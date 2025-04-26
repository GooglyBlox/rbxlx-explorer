import React, { useState } from "react";
import { TreeNode } from "@/types/rbxlx";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";

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
  return (
    <div className="p-1.5 overflow-auto">
      {nodes.map((node) => (
        <TreeViewNode
          key={node.id}
          node={node}
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
    setExpanded(!expanded);
  };

  const handleSelect = () => {
    onSelectNode(node);
  };

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
            <span className="w-4"></span>
          )}
        </div>

        <div className="mr-2">
          {node.isScript ? (
            <File size={16} className="text-yellow-500" />
          ) : hasChildren ? (
            <Folder size={16} className="text-blue-500" />
          ) : (
            <File size={16} className="text-gray-500" />
          )}
        </div>

        <div className="flex items-center overflow-hidden">
          <span className="mr-2 truncate">{node.name}</span>
          <span className="text-xs text-gray-500 truncate">{node.class}</span>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((childNode) => (
            <TreeViewNode
              key={childNode.id}
              node={childNode}
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
