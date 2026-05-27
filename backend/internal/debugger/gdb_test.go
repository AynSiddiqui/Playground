package debugger

import (
	"testing"
)

func TestCleanType(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "strips const prefix",
			input:    "const int",
			expected: "int",
		},
		{
			name:     "strips class prefix",
			input:    "class MyClass",
			expected: "MyClass",
		},
		{
			name:     "strips struct prefix",
			input:    "struct Point",
			expected: "Point",
		},
		{
			name:     "strips std::__cxx11:: namespace",
			input:    "std::__cxx11::basic_string<char>",
			expected: "std::string",
		},
		{
			name:     "replaces basic_string with full allocator",
			input:    "std::basic_string<char, std::char_traits<char>, std::allocator<char>>",
			expected: "std::string",
		},
		{
			name:     "replaces basic_string without allocator",
			input:    "std::basic_string<char>",
			expected: "std::string",
		},
		{
			name:     "handles std::__cxx11::basic_string with allocator",
			input:    "std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char>>",
			expected: "std::string",
		},
		{
			name:     "strips allocator from std::vector",
			input:    "std::vector<int, std::allocator<int>>",
			expected: "std::vector<int>",
		},
		{
			name:     "strips allocator from std::map (full type)",
			input:    "std::map<std::string, int, std::less<std::string>, std::allocator<std::pair<const std::string, int>>>",
			expected: "std::map<std::string, int>",
		},
		{
			name:     "strips comparator and allocator from std::set",
			input:    "std::set<int, std::less<int>, std::allocator<int>>",
			expected: "std::set<int>",
		},
		{
			name:     "strips allocator from std::list",
			input:    "std::list<double, std::allocator<double>>",
			expected: "std::list<double>",
		},
		{
			name:     "strips allocator from std::deque",
			input:    "std::deque<char, std::allocator<char>>",
			expected: "std::deque<char>",
		},
		{
			name:     "keeps std::pair intact with both types",
			input:    "std::pair<const std::string, int>",
			expected: "std::pair<const std::string, int>",
		},
		{
			name:     "handles nested templates in map value",
			input:    "std::map<std::string, std::vector<int, std::allocator<int>>, std::less<std::string>, std::allocator<std::pair<const std::string, std::vector<int>>>>",
			expected: "std::map<std::string, std::vector<int>>",
		},
		{
			name:     "leaves non-STL types unchanged",
			input:    "int",
			expected: "int",
		},
		{
			name:     "leaves pointer types unchanged",
			input:    "MyStruct*",
			expected: "MyStruct*",
		},
		{
			name:     "leaves user-defined templates unchanged",
			input:    "MyContainer<int, float, double>",
			expected: "MyContainer<int, float, double>",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "std::__cxx11:: in nested context",
			input:    "std::map<std::__cxx11::basic_string<char>, int>",
			expected: "std::map<std::string, int>",
		},
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
