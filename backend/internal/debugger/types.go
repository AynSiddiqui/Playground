package debugger

// Snapshot represents the complete execution state at a single point in time.
// This is the core data structure serialized as JSON and sent to the frontend.
type Snapshot struct {
	Step  int          `json:"step"`
	Line  int          `json:"line"`
	File  string       `json:"file,omitempty"`
	Stack []StackFrame `json:"stack"`
	Heap  []HeapObject `json:"heap"`
}

// StackFrame represents a single frame on the call stack.
type StackFrame struct {
	FrameID      string     `json:"frameId"`
	FunctionName string     `json:"functionName"`
	Line         int        `json:"line"`
	File         string     `json:"file,omitempty"`
	Locals       []Variable `json:"locals"`
}

// Variable represents a local variable or struct field.
type Variable struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Value       string `json:"value"`
	Address     string `json:"address,omitempty"`
	StructType  string `json:"structType,omitempty"`
}

// HeapObject represents an allocated block on the heap.
type HeapObject struct {
	Address        string          `json:"address"`
	Type           string          `json:"type"`
	Size           int             `json:"size,omitempty"`
	IsSTL          bool            `json:"isStl"`
	StructType     string          `json:"structType,omitempty"`
	Fields         []Variable      `json:"fields,omitempty"`
	Elements       []STLElement    `json:"elements,omitempty"`
	AdvancedData   interface{}     `json:"advancedData,omitempty"`
	StructuralLinks interface{}    `json:"structuralLinks,omitempty"`
	STLFlattened   interface{}     `json:"stlFlattened,omitempty"`
	Value          string          `json:"value,omitempty"`
}

// STLElement represents a single element within an STL container.
// Used for vectors (value only), maps (key+value), sets (value only), etc.
type STLElement struct {
	Index int    `json:"index,omitempty"`
	Key   string `json:"key,omitempty"`
	Value string `json:"value"`
}
