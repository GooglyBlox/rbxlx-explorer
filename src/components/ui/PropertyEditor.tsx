/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { RBXLXProperty } from "@/types/rbxlx";

interface PropertyEditorProps {
  properties: RBXLXProperty[];
  onPropertyChange: (name: string, value: any) => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  properties,
  onPropertyChange,
}) => {
  if (!properties || properties.length === 0) {
    return <div className="p-4 text-gray-400">No properties to display</div>;
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-[#161616] sticky top-0">
          <tr>
            <th className="text-left p-2 border-b border-[#2a2a2a] font-medium text-sm">
              Name
            </th>
            <th className="text-left p-2 border-b border-[#2a2a2a] font-medium text-sm">
              Type
            </th>
            <th className="text-left p-2 border-b border-[#2a2a2a] font-medium text-sm">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property, index) => (
            <PropertyRow
              key={`${property.name}-${index}`}
              property={property}
              onPropertyChange={onPropertyChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface PropertyRowProps {
  property: RBXLXProperty;
  onPropertyChange: (name: string, value: any) => void;
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  property,
  onPropertyChange,
}) => {
  const [editing, setEditing] = useState(false);

  const stringify = (v: any) => {
    if (v === undefined || v === null) return "(empty)";
    if (typeof v === "object") return JSON.stringify(v, null, 2);
    return String(v);
  };

  const initialValue = stringify(property.value);
  const [value, setValue] = useState<string>(initialValue);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = () => {
    onPropertyChange(property.name, value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setValue(initialValue);
      setEditing(false);
    }
  };

  const renderValue = () => {
    if (editing) {
      return (
        <input
          type="text"
          value={value}
          onChange={handleValueChange}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-[#232323] border border-[#333] rounded p-1 w-full text-sm"
          autoFocus
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:text-blue-400"
        onClick={() => setEditing(true)}
      >
        {stringify(property.value)}
      </div>
    );
  };

  return (
    <tr className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
      <td className="p-2 text-sm">{property.name}</td>
      <td className="p-2 text-sm text-gray-400">{property.type}</td>
      <td className="p-2 text-sm">{renderValue()}</td>
    </tr>
  );
};

export default PropertyEditor;
