/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RBXLXProperty {
  name: string;
  type: string;
  value: string | number | boolean | any;
  original?: any;
  path?: string;
}

export interface RBXLXItem {
  class: string;
  referent: string;
  properties: RBXLXProperty[];
  items?: RBXLXItem[];
  name?: string;
}

export interface RBXLXFile {
  version: string;
  items: RBXLXItem[];
}

export interface TreeNode {
  id: string;
  name: string;
  class: string;
  children?: TreeNode[];
  properties?: RBXLXProperty[];
  content?: string;
  isScript?: boolean;
  sourcePropertyPath?: string;
}

export interface ParsedRBXLX {
  raw: any;
  tree: TreeNode[];
}
