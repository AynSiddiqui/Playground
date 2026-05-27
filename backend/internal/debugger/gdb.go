package debugger

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
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
	buf := make([]byte, 4096)
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
			frame.Locals[i].Address = normalizeAddress(local.Value)
			log.Printf("[ADDR] Pointer var %q type=%q address=%q", local.Name, local.Type, frame.Locals[i].Address)
		} else if isSTLType(local.Type) || strings.Contains(local.Type, "[") {
			// For stack-allocated STLs and Arrays, get their memory address
			evalCmd := fmt.Sprintf("-data-evaluate-expression \"&%s\"", local.Name)
			if err := g.sendCommand(evalCmd); err == nil {
				evalOut := g.consumeUntilPrompt()
				for _, line := range evalOut {
					if strings.Contains(line, "value=\"") {
						val := extractQuotedValue(line, "value")
						frame.Locals[i].Address = normalizeAddress(val)
						log.Printf("[ADDR] STL/Array var %q type=%q raw_val=%q extracted_addr=%q", 
							local.Name, local.Type, val, frame.Locals[i].Address)
						break
					}
				}
			} else {
				log.Printf("[ADDR] Failed to get address for STL %q: %v", local.Name, err)
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
			address := normalizeAddress(local.Address)
			log.Printf("[EXTRACT] var=%q type=%q original_addr=%q normalized_addr=%q", local.Name, local.Type, local.Address, address)
			if address != "" && address != "0x0" && address != "0" && address != "0x0000000000000000" {
				ptrType := local.Type
				if strings.HasSuffix(ptrType, "&") {
					ptrType = strings.TrimSuffix(ptrType, "&")
					ptrType = strings.TrimSpace(ptrType) + "*"
				} else if !isPointerType(ptrType) {
					if idx := strings.Index(ptrType, "["); idx >= 0 {
						base := ptrType[:idx]
						brackets := ptrType[idx:]
						ptrType = fmt.Sprintf("%s(*)%s", base, brackets)
					} else {
						ptrType = ptrType + "*"
					}
				}
			obj := g.dereferencePointer(address, ptrType, seen)
			if obj != nil {
				// Recursively chase node pointers (next, left, right, etc.)
				children := g.chaseNodePointers(obj, seen, 10)
				heapObjects = append(heapObjects, *obj)
				heapObjects = append(heapObjects, children...)
			} else if isSTLType(cleanType(local.Type)) {
				log.Printf("[STL-FALLBACK] Triggered for var=%q type=%q (dereferencePointer failed)", local.Name, local.Type)
				delete(seen, address)
				cleanedType := cleanType(local.Type)
				obj := &HeapObject{
					Address: address,
					Type:    cleanedType,
					IsSTL:   true,
				}
				log.Printf("[STL-HEAP] Creating HeapObject address=%q type=%q", obj.Address, obj.Type)
				advCmd := fmt.Sprintf("-interpreter-exec console \"adv-dump %s \\\"%s\\\"\"", address, cleanedType)
				if err := g.sendCommand(advCmd); err == nil {
					advOutput := g.consumeUntilPrompt()
					obj.AdvancedData = g.parseAdvancedDump(advOutput)
					if advData, ok := obj.AdvancedData.(map[string]interface{}); ok {
						if elements, ok := advData["elements"].([]interface{}); ok {
							for _, el := range elements {
								if elMap, ok := el.(map[string]interface{}); ok {
									stlEl := STLElement{Value: fmt.Sprintf("%v", elMap["value"])}
									if key, ok := elMap["key"]; ok {
										stlEl.Key = fmt.Sprintf("%v", key)
										if idx, err := strconv.Atoi(stlEl.Key); err == nil {
											stlEl.Index = idx
											stlEl.Key = ""
										}
									}
									obj.Elements = append(obj.Elements, stlEl)
								}
							}
						}
					}
				}
				log.Printf("[STL-HEAP-FINAL] HeapObject ready address=%q type=%q numElements=%d", obj.Address, obj.Type, len(obj.Elements))
				heapObjects = append(heapObjects, *obj)
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
	cmd := fmt.Sprintf("-data-evaluate-expression \"*(%s)%s\"", ptrType, address)
	if err := g.sendCommand(cmd); err != nil {
		return nil // Cannot read memory
	}
	output := g.consumeUntilPrompt()

	baseType := ptrType
	if strings.Contains(ptrType, "(*)") {
		baseType = strings.Replace(ptrType, "(*)", "", 1)
	} else if strings.Contains(ptrType, "( * )") {
		baseType = strings.Replace(ptrType, "( * )", "", 1)
	} else {
		baseType = strings.TrimSuffix(ptrType, "*")
	}
	baseType = strings.TrimSpace(baseType)

	var rawVal string
	for _, line := range output {
		if strings.Contains(line, "value=\"") {
			rawVal = extractQuotedValue(line, "value")
			break
		}
	}

	obj := &HeapObject{
		Address: normalizeAddress(address),
		Type:    baseType,
		IsSTL:   isSTLType(baseType),
		Value:   rawVal,
	}

	// Attempt to extract advanced structures (trees, lists, matrices) via custom python command
	advCmd := fmt.Sprintf("-interpreter-exec console \"adv-dump %s \\\"%s\\\"\"", address, baseType)
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
	cmd := fmt.Sprintf("-data-evaluate-expression \"*(%s*)%s\"", typeName, address)
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

// parseLocals parses GDB MI locals output iteratively to handle missing value fields and quotes safely.
// Example input: locals=[{name="a",type="int",value="10"},{name="b",type="int[5]"}]
func parseLocals(output []string) []Variable {
	var locals []Variable
	for _, line := range output {
		idx := strings.Index(line, "locals=[")
		if idx < 0 {
			continue
		}
		start := idx + len("locals=[")
		
		depth := 0
		blockStart := -1
		for i := start; i < len(line); i++ {
			if line[i] == '{' {
				if depth == 0 {
					blockStart = i
				}
				depth++
			} else if line[i] == '}' {
				depth--
				if depth == 0 && blockStart != -1 {
					block := line[blockStart : i+1]
					name := extractQuotedValue(block, "name")
					typ := extractQuotedValue(block, "type")
					val := extractQuotedValue(block, "value")
					
					if name != "" && !strings.HasPrefix(name, "__") {
						locals = append(locals, Variable{
							Name:  name,
							Type:  typ,
							Value: val,
						})
					}
					blockStart = -1
				}
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
			val = strings.TrimSpace(val)
			if val == "" {
				continue
			}

			// If GDB pretty printer outputs a single-line summary with " = { ... }" prefix, strip it
			if idx := strings.Index(val, " = {"); idx >= 0 {
				val = val[idx+4:]
				val = strings.TrimSuffix(val, "}")
				val = strings.TrimSpace(val)
			} else if strings.HasPrefix(val, "{") {
				val = strings.TrimPrefix(val, "{")
				val = strings.TrimSuffix(val, "}")
				val = strings.TrimSpace(val)
			}

			// If it's a simple value that doesn't contain standard map/vector assignment formatting, return it
			if !strings.Contains(val, " = ") && !strings.Contains(val, "\n") && !strings.Contains(val, ",") {
				elements = append(elements, STLElement{
					Index: len(elements),
					Value: val,
				})
				continue
			}

			// Split by newline or comma to get individual elements
			var rawElements []string
			if strings.Contains(val, "\n") {
				rawElements = strings.Split(val, "\n")
			} else {
				// Single line split by comma (respecting quotes/brackets)
				var builder strings.Builder
				inQuote := false
				escaped := false
				for i := 0; i < len(val); i++ {
					ch := val[i]
					if escaped {
						builder.WriteByte(ch)
						escaped = false
					} else if ch == '\\' {
						builder.WriteByte(ch)
						escaped = true
					} else if ch == '"' {
						inQuote = !inQuote
						builder.WriteByte(ch)
					} else if ch == ',' && !inQuote {
						rawElements = append(rawElements, builder.String())
						builder.Reset()
					} else {
						builder.WriteByte(ch)
					}
				}
				if builder.Len() > 0 {
					rawElements = append(rawElements, builder.String())
				}
			}

			for _, l := range rawElements {
				l = strings.TrimSpace(l)
				l = strings.TrimSuffix(l, ",")
				if l == "" || l == "{" || l == "}" || strings.HasSuffix(l, "{") {
					continue
				}

				if eqIdx := strings.Index(l, " = "); eqIdx >= 0 {
					keyPart := strings.TrimSpace(l[:eqIdx])
					valPart := strings.TrimSpace(l[eqIdx+3:])

					// Clean key (strip [ ], " ", ' ')
					keyPart = strings.TrimPrefix(keyPart, "[")
					keyPart = strings.TrimSuffix(keyPart, "]")
					keyPart = strings.Trim(keyPart, "\"'")

					// Clean value (strip " ", ' ')
					valPart = strings.Trim(valPart, "\"'")

					// Check if key is a number (array index)
					if idx, err := strconv.Atoi(keyPart); err == nil {
						elements = append(elements, STLElement{
							Index: idx,
							Value: valPart,
						})
					} else {
						elements = append(elements, STLElement{
							Key:   keyPart,
							Value: valPart,
						})
					}
				} else {
					// No " = ", just value
					valPart := strings.Trim(l, "\"'")
					elements = append(elements, STLElement{
						Index: len(elements),
						Value: valPart,
					})
				}
			}
		}
	}
	return elements
}


// extractQuotedValue extracts the value from a key="value" pair in GDB/MI output.
// It properly handles escaped inner quotes.
func extractQuotedValue(s, key string) string {
	prefix := key + "=\""
	idx := strings.Index(s, prefix)
	if idx < 0 {
		return ""
	}
	start := idx + len(prefix)
	
	end := -1
	for i := start; i < len(s); i++ {
		if s[i] == '\\' && i+1 < len(s) {
			i++ // skip escaped char
			continue
		}
		if s[i] == '"' {
			end = i
			break
		}
	}
	if end < 0 {
		return ""
	}
	
	val := s[start:end]
	val = strings.ReplaceAll(val, "\\\"", "\"")
	val = strings.ReplaceAll(val, "\\n", "\n")
	val = strings.ReplaceAll(val, "\\\\", "\\")
	return val
}

func cleanType(t string) string {
	t = strings.TrimSpace(t)
	for {
		old := t
		t = strings.TrimPrefix(t, "const ")
		t = strings.TrimPrefix(t, "volatile ")
		t = strings.TrimPrefix(t, "class ")
		t = strings.TrimPrefix(t, "struct ")
		t = strings.TrimPrefix(t, "::")
		t = strings.TrimSpace(t)
		if t == old {
			break
		}
	}
	return t
}

// normalizeAddress ensures consistent address formatting for reliable matching.
// Handles cases where addresses may have trailing type info or spaces.
func normalizeAddress(addr string) string {
	// Trim whitespace
	addr = strings.TrimSpace(addr)
	// Split by space and take first part (in case GDB appended type info)
	parts := strings.Split(addr, " ")
	if len(parts) > 0 {
		addr = parts[0]
	}
	// Lowercase hex digits for consistency
	addr = strings.ToLower(addr)
	return addr
}

func isPointerType(t string) bool {
	t = strings.TrimSpace(t)
	return strings.HasSuffix(t, "*") || (strings.Contains(t, "(*)") && strings.Contains(t, "["))
}

func isSTLType(t string) bool {
	t = cleanType(t)
	stlPrefixes := []string{
		"std::vector", "std::map", "std::unordered_map",
		"std::set", "std::unordered_set", "std::list",
		"std::deque", "std::string", "std::basic_string",
		"std::stack", "std::queue", "std::priority_queue",
		"std::array", "std::pair",
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
