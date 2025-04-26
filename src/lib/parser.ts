/* eslint-disable @typescript-eslint/no-explicit-any */
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { TreeNode, ParsedRBXLX, RBXLXProperty } from "@/types/rbxlx";

interface PropertyObject {
  "@_name"?: string;
  "@_value"?: any;
  __cdata?: string;
  value?: any;
  [key: string]: any;
}

// ——————————————————————————————————————————————
// 1) Parser configuration
// ——————————————————————————————————————————————
export const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
  allowBooleanAttributes: true,
  parseTagValue: true,
  trimValues: true,
  cdataTagName: "__cdata",
  textNodeName: "value",
};

// ——————————————————————————————————————————————
// 2) Parse the RBXLX into raw + tree
// ——————————————————————————————————————————————
export function parseRBXLX(content: string): ParsedRBXLX {
  const parser = new XMLParser(parserOptions);
  const raw = parser.parse(content);
  const roblox = raw.roblox;
  const tree = processItems(roblox.Item);
  return { raw, tree };
}

// ——————————————————————————————————————————————
// 3) Extract script text out of ProtectedString
// ——————————————————————————————————————————————
function extractScriptContent(props: any): string | undefined {
  if (!props) return undefined;
  const arr = Array.isArray(props) ? props : [props];
  const src = arr.find((p: PropertyObject) => p["@_name"] === "Source");
  return src?.__cdata ?? src?.value;
}

// ——————————————————————————————————————————————
// 4) Walk Items into TreeNode[]
// ——————————————————————————————————————————————
export function processItems(items: any | any[]): TreeNode[] {
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((item) => {
    const referent = (item as any)["@_referent"];
    const cls = (item as any)["@_class"];
    const properties = processProperties(item.Properties);

    const scriptText = extractScriptContent(item.Properties?.ProtectedString);
    const node: TreeNode = {
      id: referent || generateId(),
      name: getItemName(item),
      class: String(cls || item.class || ""),
      properties,
    };

    if (scriptText !== undefined) {
      node.content = scriptText;
      node.isScript = true;
      node.sourcePropertyPath = "ProtectedString.Source";
      node.properties = properties.filter(
        (p) => !(p.type === "ProtectedString" && p.name === "Source")
      );
    }

    if (item.Item) {
      node.children = processItems(item.Item);
    }

    return node;
  });
}

// ——————————————————————————————————————————————
// 5) Name resolution: <string name="Name">…</string>
// ——————————————————————————————————————————————
function getItemName(item: any): string {
  const props = item.Properties;
  if (props?.string) {
    const arr = Array.isArray(props.string) ? props.string : [props.string];
    const nameProp = arr.find((p: PropertyObject) => p["@_name"] === "Name");
    if (nameProp)
      return String(nameProp.__cdata ?? nameProp.value ?? nameProp["@_value"]);
  }
  return String((item as any)["@_class"] || item.class || "Unknown");
}

// ——————————————————————————————————————————————
// 6) Flatten Properties into RBXLXProperty[]
// ——————————————————————————————————————————————
function processProperties(properties: any): RBXLXProperty[] {
  if (!properties) return [];
  const out: RBXLXProperty[] = [];
  for (const [type, val] of Object.entries(properties)) {
    const arr = Array.isArray(val) ? val : [val];
    arr.forEach((p: PropertyObject) => {
      out.push({
        name: p["@_name"] || "",
        type,
        value: p.__cdata ?? p["@_value"] ?? p.value,
        original: p,
        path: `${type}.${p["@_name"]}`,
      });
    });
  }
  return out;
}

// ——————————————————————————————————————————————
// 7) Unique ID generator
// ——————————————————————————————————————————————
function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ——————————————————————————————————————————————
// 8) Update a single property by referent path
// ——————————————————————————————————————————————
export function updatePropertyInRaw(
  raw: any,
  nodePath: string[],
  propertyPath: string,
  value: any
): any {
  const clone = JSON.parse(JSON.stringify(raw));
  let current = clone.roblox;

  const parts = nodePath.slice(1);
  for (const ref of parts) {
    const children = current.Item;
    if (!children) throw new Error(`No children for referent ${ref}`);
    const arr = Array.isArray(children) ? children : [children];
    const nxt = arr.find((i: any) => i["@_referent"] === ref);
    if (!nxt) throw new Error(`Could not find referent "${ref}".`);
    current = nxt;
  }

  const [type, name] = propertyPath.split(".");
  const props = current.Properties?.[type];
  if (!props) throw new Error(`Property type "${type}" missing.`);
  const entries = Array.isArray(props) ? props : [props];
  const entry = entries.find((p: any) => p["@_name"] === name);
  if (!entry) throw new Error(`Property "${name}" not found.`);

  if (type === "ProtectedString" && name === "Source") {
    entry.__cdata = value;
    delete entry.value;
  } else if (type === "string") {
    // string properties use element text rather than a value attribute
    entry.value = value;
    delete entry["@_value"];
  } else {
    entry["@_value"] = value;
    delete entry.value;
  }

  return clone;
}

// ——————————————————————————————————————————————
// 9) Shortcut for script updates
// ——————————————————————————————————————————————
export function updateScriptInRaw(
  raw: any,
  nodePath: string[],
  content: string
): any {
  return updatePropertyInRaw(raw, nodePath, "ProtectedString.Source", content);
}

// ——————————————————————————————————————————————
// 10) Export to XML
// ——————————————————————————————————————————————
export function exportToRBXLX(data: any): string {
  const opts = {
    format: true,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "value",
    suppressEmptyNode: false,
    cdataPropName: "__cdata",
  };
  const builder = new XMLBuilder(opts);
  const xml = builder.build(data);
  return '<?xml version="1.0" encoding="utf-8"?>\n' + xml;
}

// ——————————————————————————————————————————————
// 11) Update TreeNode for live UI
// ——————————————————————————————————————————————
export function updateNodeInTree(
  tree: TreeNode[],
  nodePath: string[],
  updater: (node: TreeNode) => TreeNode
): TreeNode[] {
  const newTree = JSON.parse(JSON.stringify(tree));
  const ids = nodePath.slice(1);
  function recurse(nodes: TreeNode[], idx = 0): boolean {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === ids[idx]) {
        if (idx === ids.length - 1) {
          nodes[i] = updater(nodes[i]);
          return true;
        }
        if (nodes[i].children) {
          if (recurse(nodes[i].children!, idx + 1)) return true;
        }
      }
    }
    return false;
  }
  recurse(newTree);
  return newTree;
}

// ——————————————————————————————————————————————
// 12) Compute referent path array
// ——————————————————————————————————————————————
export function getNodePath(tree: TreeNode[], nodeId: string): string[] {
  const path: string[] = ["root"];
  const stack: string[] = [];
  function dfs(nodes: TreeNode[]): boolean {
    for (const node of nodes) {
      stack.push(node.id);
      if (node.id === nodeId) {
        path.push(...stack);
        return true;
      }
      if (node.children && dfs(node.children)) return true;
      stack.pop();
    }
    return false;
  }
  dfs(tree);
  return path;
}
