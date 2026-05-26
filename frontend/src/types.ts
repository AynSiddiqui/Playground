// Shared TypeScript types matching the backend JSON schema (api/schema.json).

// --- Client → Server ---
export interface ClientMessage {
  command: 'start' | 'step' | 'stop';
  code?: string;
}

// --- Server → Client ---
export interface ServerMessage {
  event: 'status' | 'error' | 'snapshot' | 'finished' | 'LAUNCH_SUCCESS';
  state?: 'compiling' | 'launching' | 'ready' | 'stopped';
  message?: string;
  data?: Snapshot;
  exitCode?: number;
}

// --- Snapshot Schema ---
export interface Snapshot {
  step: number;
  line: number;
  file?: string;
  stack: StackFrame[];
  heap: HeapObject[];
}

export interface StackFrame {
  frameId: string;
  functionName: string;
  line: number;
  file?: string;
  locals: Variable[];
}

export type StructType = 'PRIMITIVE' | 'ARRAY_1D' | 'MATRIX_2D' | 'LINKED_LIST' | 'BINARY_TREE' | 'STL_CONTAINER';

export interface Variable {
  name: string;
  type: string;
  value: string;
  address?: string;
  structType?: StructType;
  structuralLinks?: StructuralLinks;
  stlFlattened?: STLFlattened;
}

export interface StructuralLinks {
  type: 'LINKED_LIST' | 'BINARY_TREE';
  root: string;
  nodes: Record<string, {
    value: Record<string, string>;
    links: {
      next?: string;
      prev?: string;
      left?: string;
      right?: string;
    };
  }>;
}

export interface STLFlattened {
  type: string;
  container_type: string;
  elements?: Array<{ index?: number; key?: string; value: string }>;
  rows?: string[][];
  dimensions?: number[];
  value?: string;
}

export interface HeapObject {
  address: string;
  type: string;
  size?: number;
  isStl: boolean;
  structType?: StructType;
  fields?: Variable[];
  elements?: STLElement[];
  structuralLinks?: StructuralLinks;
  stlFlattened?: STLFlattened;
  advancedData?: any;
  value?: string;
}

export interface STLElement {
  index?: number;
  key?: string;
  value: string;
}
