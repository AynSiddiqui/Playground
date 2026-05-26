package debugger

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

// GDBDebugger implements the Debugger interface using GDB's Machine Interface (MI).
type GDBDebugger struct {
	cmd      *exec.Cmd
	stdin    io.WriteCloser
	stdout   io.ReadCloser
	mu       sync.Mutex
	stepNum  int
	running  bool
	binPath  string
}

// NewGDBDebugger creates a new GDB debugger instance.
func NewGDBDebugger() *GDBDebugger {
	return &GDBDebugger{}
}

// Start launches GDB in MI mode attached to the given binary.
func (g *GDBDebugger) Start(binaryPath string) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.binPath = binaryPath
	
	workDir := filepath.Dir(binaryPath)
	binName := filepath.Base(binaryPath)
	pwd, _ := os.Getwd()
	backendDir := filepath.ToSlash(pwd)
	workDirUnix := filepath.ToSlash(workDir)

	g.cmd = exec.Command("docker", "run", "-i", "--rm",
		"--network=none",
		"-v", workDirUnix+":/src",
		"-v", backendDir+":/backend",
		"-w", "/src",
		"cppviz-runner:latest",
		"gdb", "--interpreter=mi2", "--quiet", binName)

	var err error
	g.stdin, err = g.cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdin pipe: %w", err)
	}

	g.stdout, err = g.cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdout pipe: %w", err)
	}

	if err := g.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start gdb: %w", err)
	}

	g.running = true

	// Wait for GDB to be ready (consume initial output until we see the prompt)
	g.consumeUntilPrompt()

	// Explicitly load the Python pretty printers and advanced dump scripts
	// Mount maps backend root to /backend
	g.sendCommand("-interpreter-exec console \"source /backend/scripts/stl_printers.py\"")
	g.consumeUntilPrompt()

	// Set a breakpoint at main and run to it
	if err := g.sendCommand("-break-insert main"); err != nil {
		return err
	}
	g.consumeUntilPrompt()

	if err := g.sendCommand("-exec-run"); err != nil {
		return err
	}
	g.consumeUntilStopped()

	g.stepNum = 0
	return nil
}

// Step advances execution by one source line and returns the new state.
func (g *GDBDebugger) Step() (*Snapshot, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if !g.running {
		return nil, fmt.Errorf("debugger is not running")
	}

	// Issue the next (step over) command
	if err := g.sendCommand("-exec-next"); err != nil {
		return nil, err
	}

	output := g.consumeUntilStopped()

	// Check if the program has finished or stepped out of bounds
	if containsAny(output, "*stopped,reason=\"exited", "*stopped,reason=\"exited-normally\"", "func=\"??\"", "func=\"__libc_start_main\"", "from=\"/lib/") {
		g.running = false
		return nil, fmt.Errorf("program finished")
	}

	g.stepNum++
	return g.buildSnapshot(output)
}

// GetSnapshot returns the current execution state without stepping.
func (g *GDBDebugger) GetSnapshot() (*Snapshot, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if !g.running {
		return nil, fmt.Errorf("debugger is not running")
	}

	// Get current frame info
	if err := g.sendCommand("-stack-info-frame"); err != nil {
		return nil, err
	}
	output := g.consumeUntilPrompt()

	return g.buildSnapshot(output)
}

// Stop terminates the debugger and the debugged process.
func (g *GDBDebugger) Stop() error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.running = false

	if g.stdin != nil {
		g.sendCommand("-gdb-exit")
		g.stdin.Close()
	}

	if g.cmd != nil && g.cmd.Process != nil {
		return g.cmd.Process.Kill()
	}
	return nil
}

// IsRunning returns true if the debugged process is still alive.
func (g *GDBDebugger) IsRunning() bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.running
}

// sendCommand sends a GDB/MI command.
func (g *GDBDebugger) sendCommand(cmd string) error {
	_, err := fmt.Fprintf(g.stdin, "%s\n", cmd)
	return err
}

// consumeUntilPrompt reads GDB output until a result/prompt line is found.
// Returns all accumulated output lines.
func (g *GDBDebugger) consumeUntilPrompt() []string {
	var lines []string
	var lineBuf string
	buf := make([]byte, 1024)
	for {
		n, err := g.stdout.Read(buf)
		if n > 0 {
			raw := string(buf[:n])
			log.Printf("DEBUG READ (len=%d): %q", n, raw)
			lineBuf += raw
			for {
				idx := strings.Index(lineBuf, "\n")
				if idx >= 0 {
					line := lineBuf[:idx]
					line = strings.TrimSuffix(line, "\r")
					lines = append(lines, line)
					lineBuf = lineBuf[idx+1:]
					
					// If the prompt arrived with a newline
					if line == "(gdb) " || line == "(gdb)" {
						return lines
					}
				} else {
					if strings.HasSuffix(lineBuf, "(gdb) ") {
						lines = append(lines, "(gdb)")
						return lines
					}
					if lineBuf == "(gdb)" {
					    lines = append(lines, "(gdb)")
					    return lines
					}
					break
				}
			}
		}
		if err != nil {
			break
		}
	}
	return lines
}

// consumeUntilStopped loops consumeUntilPrompt until the accumulated lines contain a *stopped event.
func (g *GDBDebugger) consumeUntilStopped() []string {
	var allLines []string
	for {
		lines := g.consumeUntilPrompt()
		allLines = append(allLines, lines...)
		if containsAny(lines, "*stopped") {
			break
		}
	}
	return allLines
}

// buildSnapshot constructs a Snapshot from GDB/MI output by querying
// the stack, locals, and evaluating variables.
func (g *GDBDebugger) buildSnapshot(contextOutput []string) (*Snapshot, error) {
	snapshot := &Snapshot{
		Step: g.stepNum,
	}

	// Get current location
	if err := g.sendCommand("-stack-info-frame"); err != nil {
		return nil, err
	}
	frameOutput := g.consumeUntilPrompt()
	snapshot.Line = parseLineFromFrame(frameOutput)
	snapshot.File = parseFileFromFrame(frameOutput)

	// Get stack depth
	if err := g.sendCommand("-stack-info-depth"); err != nil {
		return nil, err
	}
	depthOutput := g.consumeUntilPrompt()
	depth := parseDepth(depthOutput)

	// Get all frames
	snapshot.Stack = make([]StackFrame, 0, depth)
	for i := 0; i < depth; i++ {
		frame, err := g.getFrame(i)
		if err != nil {
			continue
		}
		
		// Payload Sanitization: Strip out system library teardown frames
		if frame.FunctionName == "??" || frame.FunctionName == "__libc_start_main" || strings.Contains(frame.File, "libc-start.c") {
			continue
		}
		
		snapshot.Stack = append(snapshot.Stack, *frame)
	}

	// Extract heap objects by traversing pointers from locals
	snapshot.Heap = g.extractHeapObjects(snapshot.Stack)

	return snapshot, nil
}

// getFrame extracts information about a single stack frame.
func (g *GDBDebugger) getFrame(frameNum int) (*StackFrame, error) {
	// Select the frame
	cmd := fmt.Sprintf("-stack-select-frame %d", frameNum)
	if err := g.sendCommand(cmd); err != nil {
		return nil, err
	}
	g.consumeUntilPrompt()

	// Get frame info
	if err := g.sendCommand("-stack-info-frame"); err != nil {
		return nil, err
	}
	frameOutput := g.consumeUntilPrompt()

	frame := &StackFrame{
		FrameID:      fmt.Sprintf("%d", frameNum),
		FunctionName: parseFunctionFromFrame(frameOutput),
		Line:         parseLineFromFrame(frameOutput),
		File:         parseFileFromFrame(frameOutput),
	}

	// Get local variables for this frame
	cmd = fmt.Sprintf("-stack-list-locals --thread 1 --frame %d --simple-values", frameNum)
	if err := g.sendCommand(cmd); err != nil {
		return nil, err
	}
	localsOutput := g.consumeUntilPrompt()
	frame.Locals = parseLocals(localsOutput)

	// Explicitly fetch addresses for complex stack variables (STLs, Arrays, Structs)
	// so they can be processed as independent heap objects
	for i, local := range frame.Locals {
		if isPointerType(local.Type) {
			frame.Locals[i].Address = local.Value
		} else if isSTLType(local.Type) || strings.Contains(local.Type, "[") {
			// For stack-allocated STLs and Arrays, get their memory address
			evalCmd := fmt.Sprintf("-data-evaluate-expression &%s", local.Name)
			if err := g.sendCommand(evalCmd); err == nil {
				evalOut := g.consumeUntilPrompt()
				for _, line := range evalOut {
					if strings.Contains(line, "value=\"") {
						val := extractQuotedValue(line, "value")
						// value usually looks like: 0x7fffffffe100
						// We might need to split by space if it includes type info
						parts := strings.Split(val, " ")
						if len(parts) > 0 {
							frame.Locals[i].Address = parts[0]
						}
						break
					}
				}
			}
		}
	}

	return frame, nil
}

// extractHeapObjects traverses pointer-type locals to find heap allocations.
func (g *GDBDebugger) extractHeapObjects(stack []StackFrame) []HeapObject {
	var heapObjects []HeapObject
	seen := make(map[string]bool)

	for _, frame := range stack {
		for _, local := range frame.Locals {
			address := local.Address
			address = strings.Split(address, " ")[0]
			if address != "" && address != "0x0" && address != "0" && address != "0x0000000000000000" {
				ptrType := local.Type
				// If the variable is a stack value (not a pointer), treat its address as a pointer to its type
				if !strings.HasSuffix(strings.TrimSpace(ptrType), "*") {
					ptrType = ptrType + "*"
				}
				obj := g.dereferencePointer(address, ptrType, seen)
				if obj != nil {
					// Recursively chase node pointers (next, left, right, etc.)
					children := g.chaseNodePointers(obj, seen, 10)
					heapObjects = append(heapObjects, *obj)
					heapObjects = append(heapObjects, children...)
				}
			}
		}
	}

	return heapObjects
}

// dereferencePointer attempts to read the heap object at the given address.
func (g *GDBDebugger) dereferencePointer(address, ptrType string, seen map[string]bool) *HeapObject {
	if seen[address] {
		return nil
	}
	seen[address] = true

	// Dereference the pointer using GDB's -data-evaluate-expression
	cmd := fmt.Sprintf("-data-evaluate-expression *(%s)%s", ptrType, address)
	if err := g.sendCommand(cmd); err != nil {
		return nil // Cannot read memory
	}
	output := g.consumeUntilPrompt()

	baseType := strings.TrimSuffix(ptrType, "*")
	baseType = strings.TrimSpace(baseType)

	obj := &HeapObject{
		Address: address,
		Type:    baseType,
		IsSTL:   isSTLType(baseType),
	}

	// Attempt to extract advanced structures (trees, lists, matrices) via custom python command
	advCmd := fmt.Sprintf("-interpreter-exec console \"adv-dump %s %s\"", address, baseType)
	if err := g.sendCommand(advCmd); err == nil {
		advOutput := g.consumeUntilPrompt()
		obj.AdvancedData = g.parseAdvancedDump(advOutput)
	}

	if obj.IsSTL {
		// Use GDB's pretty printer output
		obj.Elements = g.extractSTLElements(address, baseType)
	} else {
		// Parse struct fields from the evaluation output
		obj.Fields = parseFieldsFromEval(output)
	}

	return obj
}

// chaseNodePointers recursively follows pointer-typed struct fields (next, left, right)
// to build a chain of HeapObjects representing linked lists and trees.
// Returns a flat slice of all discovered child HeapObjects.
// maxDepth prevents infinite loops from circular references.
func (g *GDBDebugger) chaseNodePointers(obj *HeapObject, seen map[string]bool, maxDepth int) []HeapObject {
	if maxDepth <= 0 || obj == nil {
		return nil
	}

	var result []HeapObject

	// Look through the fields for pointer-typed members that reference other nodes
	pointerFields := []string{"next", "left", "right", "prev", "parent"}
	for _, field := range obj.Fields {
		isChaseTarget := false
		for _, pf := range pointerFields {
			if strings.EqualFold(field.Name, pf) {
				isChaseTarget = true
				break
			}
		}
		if !isChaseTarget || !isPointerType(field.Type) {
			continue
		}
		if field.Value == "0x0" || field.Value == "0" || field.Value == "" {
			continue
		}
		// Recursively dereference child nodes
		child := g.dereferencePointer(field.Value, field.Type, seen)
		if child != nil {
			// Collect this child
			result = append(result, *child)
			// And recursively collect its children
			grandchildren := g.chaseNodePointers(child, seen, maxDepth-1)
			result = append(result, grandchildren...)
		}
	}

	return result
}

// extractSTLElements uses GDB's Python pretty printers to get STL container contents.
func (g *GDBDebugger) extractSTLElements(address, typeName string) []STLElement {
	// Use print command which triggers pretty printers
	cmd := fmt.Sprintf("-data-evaluate-expression *(%s*)%s", typeName, address)
	if err := g.sendCommand(cmd); err != nil {
		return nil
	}
	output := g.consumeUntilPrompt()

	return parseSTLOutput(output, typeName)
}

// --- Parsing helpers ---

func parseLineFromFrame(output []string) int {
	for _, line := range output {
		if idx := strings.Index(line, "line=\""); idx >= 0 {
			numStr := extractQuotedValue(line[idx:], "line")
			var n int
			fmt.Sscanf(numStr, "%d", &n)
			return n
		}
	}
	return 0
}

func parseFileFromFrame(output []string) string {
	for _, line := range output {
		if idx := strings.Index(line, "fullname=\""); idx >= 0 {
			return extractQuotedValue(line[idx:], "fullname")
		}
		if idx := strings.Index(line, "file=\""); idx >= 0 {
			return extractQuotedValue(line[idx:], "file")
		}
	}
	return ""
}

func parseFunctionFromFrame(output []string) string {
	for _, line := range output {
		if idx := strings.Index(line, "func=\""); idx >= 0 {
			return extractQuotedValue(line[idx:], "func")
		}
	}
	return ""
}

func parseDepth(output []string) int {
	for _, line := range output {
		if idx := strings.Index(line, "depth=\""); idx >= 0 {
			numStr := extractQuotedValue(line[idx:], "depth")
			var n int
			fmt.Sscanf(numStr, "%d", &n)
			return n
		}
	}
	return 1
}

// localsRe matches individual variable blocks in GDB MI locals output.
// Example input: locals=[{name="a",type="int",value="10"},{name="b",type="int",value="20"}]
var localsRe = regexp.MustCompile(`name="([^"]*)",type="([^"]*)",value="([^"]*)"`)

func parseLocals(output []string) []Variable {
	var locals []Variable
	for _, line := range output {
		matches := localsRe.FindAllStringSubmatch(line, -1)
		for _, m := range matches {
			if len(m) == 4 && m[1] != "" {
				locals = append(locals, Variable{
					Name:  m[1],
					Type:  m[2],
					Value: m[3],
				})
			}
		}
	}
	return locals
}

func parseFieldsFromEval(output []string) []Variable {
	var fields []Variable
	for _, line := range output {
		if !strings.Contains(line, "value=\"") {
			continue
		}
		val := extractQuotedValue(line, "value")
		if val == "" || !strings.HasPrefix(val, "{") {
			continue
		}
		inner := strings.TrimPrefix(val, "{")
		inner = strings.TrimSuffix(inner, "}")

		var pairs []string
		depth := 0
		start := 0
		for i := 0; i < len(inner); i++ {
			ch := inner[i]
			if ch == '{' {
				depth++
			} else if ch == '}' {
				depth--
			} else if ch == ',' && depth == 0 {
				pairs = append(pairs, inner[start:i])
				start = i + 1
				if start < len(inner) && inner[start] == ' ' {
					start++
				}
			}
		}
		if start < len(inner) {
			pairs = append(pairs, inner[start:])
		}

		for _, pair := range pairs {
			pair = strings.TrimSpace(pair)
			if pair == "" {
				continue
			}
			eqIdx := strings.Index(pair, " = ")
			if eqIdx < 0 {
				continue
			}
			name := strings.TrimSpace(pair[:eqIdx])
			value := strings.TrimSpace(pair[eqIdx+3:])

			fieldType := ""
			if strings.HasPrefix(value, "0x") {
				fieldType = "struct *"
			} else if _, err := strconv.Atoi(value); err == nil {
				fieldType = "int"
			} else if value == "true" || value == "false" {
				fieldType = "bool"
			} else if strings.HasPrefix(value, "\"") {
				fieldType = "char *"
			}

			fields = append(fields, Variable{
				Name:  name,
				Type:  fieldType,
				Value: value,
			})
		}
	}
	return fields
}

func parseSTLOutput(output []string, typeName string) []STLElement {
	var elements []STLElement
	// GDB pretty printers output STL containers in a structured format.
	// This parser handles the common case of vectors and maps.
	for _, line := range output {
		if strings.Contains(line, "value=\"") {
			val := extractQuotedValue(line, "value")
			elements = append(elements, STLElement{
				Index: len(elements),
				Value: val,
			})
		}
	}
	return elements
}

// extractQuotedValue extracts the value from a key="value" pair in GDB/MI output.
func extractQuotedValue(s, key string) string {
	prefix := key + "=\""
	idx := strings.Index(s, prefix)
	if idx < 0 {
		return ""
	}
	start := idx + len(prefix)
	end := strings.Index(s[start:], "\"")
	if end < 0 {
		return ""
	}
	return s[start : start+end]
}

func isPointerType(t string) bool {
	return strings.HasSuffix(strings.TrimSpace(t), "*")
}

func isSTLType(t string) bool {
	t = strings.TrimSpace(t)
	stlPrefixes := []string{
		"std::vector", "std::map", "std::unordered_map",
		"std::set", "std::unordered_set", "std::list",
		"std::deque", "std::string", "std::basic_string",
	}
	for _, prefix := range stlPrefixes {
		if strings.HasPrefix(t, prefix) {
			return true
		}
	}
	return false
}

func containsAny(lines []string, needles ...string) bool {
	for _, line := range lines {
		for _, needle := range needles {
			if strings.Contains(line, needle) {
				return true
			}
		}
	}
	return false
}

func (g *GDBDebugger) parseAdvancedDump(output []string) interface{} {
	var jsonStr string
	recording := false
	for _, line := range output {
		if strings.HasPrefix(line, "~\"") {
			// Unescape standard C string escaping in GDB console output
			content := line[2 : len(line)-1]
			content = strings.ReplaceAll(content, "\\n", "\n")
			content = strings.ReplaceAll(content, "\\\"", "\"")
			content = strings.ReplaceAll(content, "\\\\", "\\")

			if strings.Contains(content, "ADV_JSON_BEGIN") {
				recording = true
				continue
			}
			if strings.Contains(content, "ADV_JSON_END") {
				break
			}
			if recording {
				jsonStr += content
			}
		}
	}

	if jsonStr == "" {
		return nil
	}

	var data interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		return nil
	}
	return data
}

// Ensure GDBDebugger implements the Debugger interface.
var _ Debugger = (*GDBDebugger)(nil)

// MarshalSnapshot converts a snapshot to JSON bytes.
func MarshalSnapshot(s *Snapshot) ([]byte, error) {
	return json.Marshal(s)
}
