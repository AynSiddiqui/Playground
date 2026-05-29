package debugger

import (
	"io"
	"testing"
)

func TestCleanType(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"strips const prefix", "const int", "int"},
		{"strips class prefix", "class MyClass", "MyClass"},
		{"strips struct prefix", "struct Point", "Point"},
		{"strips std::__cxx11:: namespace", "std::__cxx11::basic_string<char>", "std::string"},
		{"replaces basic_string with full allocator", "std::basic_string<char, std::char_traits<char>, std::allocator<char>>", "std::string"},
		{"replaces basic_string without allocator", "std::basic_string<char>", "std::string"},
		{"handles std::__cxx11::basic_string with allocator", "std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char>>", "std::string"},
		{"strips allocator from std::vector", "std::vector<int, std::allocator<int>>", "std::vector<int>"},
		{"strips allocator from std::map (full type)", "std::map<std::string, int, std::less<std::string>, std::allocator<std::pair<const std::string, int>>>", "std::map<std::string, int>"},
		{"strips comparator and allocator from std::set", "std::set<int, std::less<int>, std::allocator<int>>", "std::set<int>"},
		{"strips allocator from std::list", "std::list<double, std::allocator<double>>", "std::list<double>"},
		{"strips allocator from std::deque", "std::deque<char, std::allocator<char>>", "std::deque<char>"},
		{"keeps std::pair intact with both types", "std::pair<const std::string, int>", "std::pair<const std::string, int>"},
		{"handles nested templates in map value", "std::map<std::string, std::vector<int, std::allocator<int>>, std::less<std::string>, std::allocator<std::pair<const std::string, std::vector<int>>>>", "std::map<std::string, std::vector<int>>"},
		{"leaves non-STL types unchanged", "int", "int"},
		{"leaves pointer types unchanged", "MyStruct*", "MyStruct*"},
		{"leaves user-defined templates unchanged", "MyContainer<int, float, double>", "MyContainer<int, float, double>"},
		{"empty string", "", ""},
		{"std::__cxx11:: in nested context", "std::map<std::__cxx11::basic_string<char>, int>", "std::map<std::string, int>"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cleanType(tt.input)
			if got != tt.expected {
				t.Errorf("cleanType(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseLineFromFrame(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected int
	}{
		{"normal frame output", []string{`frame={level="0",addr="0x401234",func="main",file="test.cpp",fullname="/src/test.cpp",line="42"}`}, 42},
		{"no line field", []string{`frame={level="0",func="main"}`}, 0},
		{"empty input", []string{}, 0},
		{"multiple lines", []string{"garbage", `frame={line="7"}`, "more garbage"}, 7},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseLineFromFrame(tt.input)
			if got != tt.expected {
				t.Errorf("parseLineFromFrame(%v) = %d, want %d", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseFileFromFrame(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected string
	}{
		{"fullname field", []string{`frame={fullname="/src/test.cpp"}`}, "/src/test.cpp"},
		{"file field fallback", []string{`frame={file="test.cpp"}`}, "test.cpp"},
		{"no file info", []string{`frame={level="0"}`}, ""},
		{"prefers fullname over file", []string{`frame={fullname="/src/main.cpp",file="main.cpp"}`}, "/src/main.cpp"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseFileFromFrame(tt.input)
			if got != tt.expected {
				t.Errorf("parseFileFromFrame(%v) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseFunctionFromFrame(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected string
	}{
		{"normal function", []string{`frame={func="main"}`}, "main"},
		{"template function", []string{`frame={func="foo<int>"}`}, "foo<int>"},
		{"no function", []string{`frame={line="42"}`}, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseFunctionFromFrame(tt.input)
			if got != tt.expected {
				t.Errorf("parseFunctionFromFrame(%v) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseDepth(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected int
	}{
		{"normal depth", []string{`^done,depth="5"`}, 5},
		{"depth=1", []string{`^done,depth="1"`}, 1},
		{"no depth field", []string{`^done,frame={}`}, 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseDepth(tt.input)
			if got != tt.expected {
				t.Errorf("parseDepth(%v) = %d, want %d", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseLocals(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		wantLen  int
		wantName string
	}{
		{"single int local", []string{`^done,locals=[{name="x",type="int",value="42"}]`}, 1, "x"},
		{"multiple locals", []string{`^done,locals=[{name="a",type="int",value="1"},{name="b",type="float",value="2.5"}]`}, 2, "a"},
		{"missing value field", []string{`^done,locals=[{name="arr",type="int[5]"}]`}, 1, "arr"},
		{"skips __ prefixed locals", []string{`^done,locals=[{name="__x",type="int",value="0"},{name="y",type="int",value="1"}]`}, 1, "y"},
		{"STL type local", []string{`^done,locals=[{name="vec",type="std::vector<int>"}]`}, 1, "vec"},
		{"malformed braces", []string{`^done,locals=[{name="x",type="int"`}, 0, ""},
		{"empty locals", []string{`^done,locals=[]`}, 0, ""},
		{"no locals line", []string{`^done,stack=...`}, 0, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseLocals(tt.input)
			if len(got) != tt.wantLen {
				t.Errorf("parseLocals(%v) returned %d locals, want %d", tt.input, len(got), tt.wantLen)
				return
			}
			if tt.wantLen > 0 && got[0].Name != tt.wantName {
				t.Errorf("parseLocals(%v)[0].Name = %q, want %q", tt.input, got[0].Name, tt.wantName)
			}
		})
	}
}

func TestParseLocalsValues(t *testing.T) {
	input := []string{`^done,locals=[{name="x",type="int",value="42"},{name="y",type="float",value="3.14"}]`}
	got := parseLocals(input)
	if len(got) != 2 { t.Fatalf("expected 2 locals, got %d", len(got)) }
	if got[0].Name != "x" || got[0].Type != "int" || got[0].Value != "42" {
		t.Errorf("first local = %+v, want {Name:x Type:int Value:42}", got[0])
	}
	if got[1].Name != "y" || got[1].Type != "float" || got[1].Value != "3.14" {
		t.Errorf("second local = %+v, want {Name:y Type:float Value:3.14}", got[1])
	}
}

func TestParseFieldsFromEval(t *testing.T) {
	tests := []struct {
		name    string
		input   []string
		wantLen int
	}{
		{"struct with pointer fields", []string{`value="{x = 1, y = 2, next = 0x401234}"`}, 3},
		{"nested structs", []string{`value="{head = 0x401234, size = 10}"`}, 2},
		{"empty struct", []string{`value="{}"`}, 0},
		{"truncated output (no value line)", []string{`done`}, 0},
		{"bool and string fields", []string{`value="{active = true, name = \"hello\"}"`}, 2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseFieldsFromEval(tt.input)
			if len(got) != tt.wantLen {
				t.Errorf("parseFieldsFromEval(%v) returned %d fields, want %d", tt.input, len(got), tt.wantLen)
			}
		})
	}
}

func TestNormalizeAddress(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"0x401234", "0x401234"},
		{"0x401234 ", "0x401234"},
		{"0X401ABC", "0x401abc"},
		{"0x401234 (type_info)", "0x401234"},
		{"", ""},
		{"0x0", "0x0"},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := normalizeAddress(tt.input)
			if got != tt.expected {
				t.Errorf("normalizeAddress(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestIsPointerType(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"int*", true},
		{"struct Point*", true},
		{"int", false},
		{"std::vector<int>", false},
		{"int(*)[5]", true},
		{"", false},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := isPointerType(tt.input)
			if got != tt.expected {
				t.Errorf("isPointerType(%q) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestIsSTLType(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"std::vector<int>", true},
		{"std::map<std::string, int>", true},
		{"std::string", true},
		{"std::pair<int, float>", true},
		{"int", false},
		{"MyStruct", false},
		{"std::my_custom_type", false},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := isSTLType(tt.input)
			if got != tt.expected {
				t.Errorf("isSTLType(%q) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestContainsAny(t *testing.T) {
	tests := []struct {
		name    string
		lines   []string
		needles []string
		want    bool
	}{
		{"finds needle", []string{"hello world", "*stopped"}, []string{"*stopped"}, true},
		{"no match", []string{"hello world"}, []string{"*stopped"}, false},
		{"multiple needles", []string{"exited"}, []string{"*stopped", "exited"}, true},
		{"empty lines", []string{}, []string{"*stopped"}, false},
		{"empty needles", []string{"hello"}, []string{}, false},
		{"substring match", []string{"reason=\"exited-normally\""}, []string{"exited"}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := containsAny(tt.lines, tt.needles...)
			if got != tt.want {
				t.Errorf("containsAny(%v, %v) = %v, want %v", tt.lines, tt.needles, got, tt.want)
			}
		})
	}
}

func TestStripDefaultTemplateArgs(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"no template args", "int", "int"},
		{"std::vector with allocator", "std::vector<int, std::allocator<int>>", "std::vector<int>"},
		{"std::map with comparator and allocator", "std::map<std::string, int, std::less<std::string>, std::allocator<std::pair<const std::string, int>>>", "std::map<std::string, int>"},
		{"std::pair kept intact", "std::pair<const std::string, int>", "std::pair<const std::string, int>"},
		{"unknown container unchanged", "MyContainer<int, float>", "MyContainer<int, float>"},
		{"std::vector without allocator unchanged", "std::vector<int>", "std::vector<int>"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := stripDefaultTemplateArgs(tt.input)
			if got != tt.expected {
				t.Errorf("stripDefaultTemplateArgs(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseSTLOutput(t *testing.T) {
	tests := []struct {
		name     string
		output   []string
		typeName string
		wantLen  int
		wantVal  string
	}{
		{"vector of ints", []string{`value="{0, 1, 2}"`}, "std::vector<int>", 3, "0"},
		{"map string to int", []string{`value="{[0] = \"a\", [1] = \"b\"}"`}, "std::map<int, std::string>", 2, "a"},
		{"set of ints", []string{`value="{10, 20, 30}"`}, "std::set<int>", 3, "10"},
		{"empty container", []string{`value="{}"`}, "std::vector<int>", 1, ""},
		{"no value line", []string{`^done`}, "std::vector<int>", 0, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseSTLOutput(tt.output, tt.typeName)
			if len(got) != tt.wantLen {
				t.Errorf("parseSTLOutput() returned %d elements, want %d", len(got), tt.wantLen)
			}
			if tt.wantLen > 0 && len(got) > 0 && got[0].Value != tt.wantVal {
				t.Errorf("parseSTLOutput()[0].Value = %q, want %q", got[0].Value, tt.wantVal)
			}
		})
	}
}

func TestParseAdvancedDump(t *testing.T) {
	d := &GDBDebugger{}
	tests := []struct {
		name    string
		input   []string
		wantNil bool
	}{
		{"valid JSON", []string{`~"ADV_JSON_BEGIN"`, `~"{"type":"LINKED_LIST","nodes":{}}"`, `~"ADV_JSON_END"`}, false},
		{"malformed JSON", []string{`~"ADV_JSON_BEGIN"`, `~"{invalid"`, `~"ADV_JSON_END"`}, true},
		{"no markers", []string{`~"hello"`, `~"world"`}, true},
		{"ADV_JSON_BEGIN without end (parses partial)", []string{`~"ADV_JSON_BEGIN"`, `~"{"key":"val"}"`}, false},
		{"empty input", []string{}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := d.parseAdvancedDump(tt.input)
			if tt.wantNil && got != nil {
				t.Errorf("parseAdvancedDump() = %v, want nil", got)
			}
			if !tt.wantNil && got == nil {
				t.Errorf("parseAdvancedDump() = nil, want non-nil")
			}
		})
	}
}

// testGDBWithStdout creates a GDBDebugger with a synthetic stdout for I/O testing.
func testGDBWithStdout(data string) *GDBDebugger {
	r, w := io.Pipe()
	g := &GDBDebugger{stdout: r}
	go func() {
		w.Write([]byte(data))
		w.Close()
	}()
	return g
}

func TestConsumeUntilPrompt_basic(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantMin  int
		wantLast string
	}{
		{
			name:     "single line with prompt at end",
			input:    `~"GNU gdb (Ubuntu) 12.1\n"` + "\n(gdb) ",
			wantMin:  2,
			wantLast: "(gdb)",
		},
		{
			name:     "multi-line output before prompt",
			input:    "line1\nline2\nline3\n(gdb) ",
			wantMin:  4,
			wantLast: "(gdb)",
		},
		{
			name:     "prompt without trailing spaces",
			input:    "output\n(gdb)",
			wantMin:  2,
			wantLast: "(gdb)",
		},
		{
			name:     "prompt mid-buffer stops at first prompt",
			input:    "first\n(gdb) \nsecond\n(gdb) ",
			wantMin:  2,
			wantLast: "(gdb) ",
		},
		{
			name:     "carriage return before newline",
			input:    "line1\r\n(gdb) ",
			wantMin:  2,
			wantLast: "(gdb)",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			g := testGDBWithStdout(tt.input)
			lines := g.consumeUntilPrompt()
			if len(lines) < tt.wantMin {
				t.Errorf("consumeUntilPrompt() returned %d lines, want >= %d\nlines: %q", len(lines), tt.wantMin, lines)
			}
			if len(lines) > 0 && lines[len(lines)-1] != tt.wantLast {
				t.Errorf("last line = %q, want %q", lines[len(lines)-1], tt.wantLast)
			}
		})
	}
}

func TestConsumeUntilPrompt_empty(t *testing.T) {
	g := testGDBWithStdout("")
	lines := g.consumeUntilPrompt()
	if len(lines) != 0 {
		t.Errorf("expected 0 lines, got %d: %q", len(lines), lines)
	}
}

func TestConsumeUntilStopped_basic(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{
			name:  "*stopped in first prompt cycle",
			input: "line1\n*stopped,reason=\"end-stepping-range\"\n(gdb) ",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			g := testGDBWithStdout(tt.input)
			lines := g.consumeUntilStopped()
			if !containsAny(lines, "*stopped") {
				t.Errorf("consumeUntilStopped() lines = %q, expected *stopped", lines)
			}
		})
	}
}



func TestExtractGDBVersion(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected string
	}{
		{
			name:     "Ubuntu GDB 12.1",
			input:    []string{`~"GNU gdb (Ubuntu 12.1-0ubuntu1~22.04) 12.1\n"`},
			expected: "12.1",
		},
		{
			name:     "plain version string",
			input:    []string{`~"GNU gdb 14.2"`},
			expected: "14.2",
		},
		{
			name:     "no version in line",
			input:    []string{`~"Copyright (C) 2024 Free Software Foundation"`},
			expected: "",
		},
		{
			name:     "multiple lines with version",
			input:    []string{`~"Copyright..."`, `~"GNU gdb (Debian) 13.1\n"`},
			expected: "13.1",
		},
		{
			name:     "empty input",
			input:    []string{},
			expected: "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractGDBVersion(tt.input)
			if got != tt.expected {
				t.Errorf("extractGDBVersion() = %q, want %q", got, tt.expected)
			}
		})
	}
}
