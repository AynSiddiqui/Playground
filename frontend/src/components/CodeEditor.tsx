import React, { useRef, useCallback } from 'react';
import Editor, { type OnMount, loader } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  }
};

loader.config({ monaco });

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  highlightLine: number | null;
}

const DEFAULT_CODE = `#include <iostream>

int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    std::cout << c << "\\n";
    return 0;
}
`;

/** Pre-written C++ boilerplate snippets for common data structures. */
const CODE_SNIPPETS: Record<string, { label: string; code: string }> = {
  default: {
    label: '📝 Default (a + b)',
    code: DEFAULT_CODE,
  },
  linked_list: {
    label: '🔗 Linked List',
    code: `#include <iostream>

struct ListNode {
    int data;
    ListNode* next;
};

int main() {
    ListNode* a = new ListNode{1, nullptr};
    ListNode* b = new ListNode{2, nullptr};
    ListNode* c = new ListNode{3, nullptr};
    a->next = b;
    b->next = c;

    ListNode* cur = a;
    while (cur) {
        std::cout << cur->data << " ";
        cur = cur->next;
    }
    std::cout << "\\n";

    delete c;
    delete b;
    delete a;
    return 0;
}
`,
  },
  binary_tree: {
    label: '🌳 Binary Tree',
    code: `#include <iostream>

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
};

int main() {
    TreeNode* root = new TreeNode{1, nullptr, nullptr};
    root->left = new TreeNode{2, nullptr, nullptr};
    root->right = new TreeNode{3, nullptr, nullptr};
    root->left->left = new TreeNode{4, nullptr, nullptr};
    root->left->right = new TreeNode{5, nullptr, nullptr};

    // Simple inorder print
    std::cout << root->left->left->val << " ";
    std::cout << root->left->val << " ";
    std::cout << root->left->right->val << " ";
    std::cout << root->val << " ";
    std::cout << root->right->val << "\\n";

    delete root->left->left;
    delete root->left->right;
    delete root->left;
    delete root->right;
    delete root;
    return 0;
}
`,
  },
  vector: {
    label: '📦 Vector',
    code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {10, 20, 30, 40, 50};
    v.push_back(60);
    v.push_back(70);

    for (int i = 0; i < v.size(); i++) {
        std::cout << v[i] << " ";
    }
    std::cout << "\\n";
    return 0;
}
`,
  },
  stack: {
    label: '📚 Stack',
    code: `#include <iostream>
#include <stack>

int main() {
    std::stack<int> s;
    s.push(10);
    s.push(20);
    s.push(30);
    s.push(40);

    while (!s.empty()) {
        std::cout << s.top() << " ";
        s.pop();
    }
    std::cout << "\\n";
    return 0;
}
`,
  },
  queue: {
    label: '📮 Queue',
    code: `#include <iostream>
#include <queue>

int main() {
    std::queue<int> q;
    q.push(10);
    q.push(20);
    q.push(30);
    q.push(40);

    while (!q.empty()) {
        std::cout << q.front() << " ";
        q.pop();
    }
    std::cout << "\\n";
    return 0;
}
`,
  },
  map: {
    label: '🗺️ Map',
    code: `#include <iostream>
#include <map>

int main() {
    std::map<std::string, int> ages;
    ages["Alice"] = 25;
    ages["Bob"] = 30;
    ages["Charlie"] = 35;

    for (auto& pair : ages) {
        std::cout << pair.first << ": " << pair.second << "\\n";
    }
    return 0;
}
`,
  },
  set: {
    label: '🎯 Set',
    code: `#include <iostream>
#include <set>

int main() {
    std::set<int> s;
    s.insert(5);
    s.insert(3);
    s.insert(8);
    s.insert(1);
    s.insert(3);  // duplicate, won't be added

    for (int x : s) {
        std::cout << x << " ";
    }
    std::cout << "\\n";
    return 0;
}
`,
  },
  priority_queue: {
    label: '⛰️ Priority Queue (Heap)',
    code: `#include <iostream>
#include <queue>

int main() {
    std::priority_queue<int> pq;
    pq.push(30);
    pq.push(10);
    pq.push(50);
    pq.push(20);

    while (!pq.empty()) {
        std::cout << pq.top() << " ";
        pq.pop();
    }
    std::cout << "\\n";
    return 0;
}
`,
  },
  pair: {
    label: '🔀 Pair',
    code: `#include <iostream>
#include <utility>

int main() {
    std::pair<int, std::string> p1(1, "hello");
    std::pair<int, std::string> p2(2, "world");

    std::cout << p1.first << ": " << p1.second << "\\n";
    std::cout << p2.first << ": " << p2.second << "\\n";
    return 0;
}
`,
  },
  array_2d: {
    label: '📊 2D Array',
    code: `#include <iostream>
#include <vector>

int main() {
    std::vector<std::vector<int>> matrix = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };

    for (int i = 0; i < matrix.size(); i++) {
        for (int j = 0; j < matrix[i].size(); j++) {
            std::cout << matrix[i][j] << " ";
        }
        std::cout << "\\n";
    }
    return 0;
}
`,
  },
};

/**
 * Monaco Editor configured for C++ with line highlighting and code snippets.
 */
const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, highlightLine }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const handleEditorMount: OnMount = useCallback((editorInstance) => {
    editorRef.current = editorInstance;
    decorationsRef.current = editorInstance.createDecorationsCollection([]);
  }, []);

  // Update line highlighting when the highlight line changes
  React.useEffect(() => {
    if (!editorRef.current || !decorationsRef.current) return;

    if (highlightLine && highlightLine > 0) {
      decorationsRef.current.set([
        {
          range: {
            startLineNumber: highlightLine,
            startColumn: 1,
            endLineNumber: highlightLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'highlighted-line',
            glyphMarginClassName: 'highlighted-glyph',
          },
        },
      ]);

      // Scroll to the highlighted line
      editorRef.current.revealLineInCenter(highlightLine);
    } else {
      decorationsRef.current.set([]);
    }
  }, [highlightLine]);

  const handleSnippetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    if (key && CODE_SNIPPETS[key]) {
      onCodeChange(CODE_SNIPPETS[key].code);
    }
  }, [onCodeChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '6px 10px',
        background: 'rgba(99,115,255,0.08)',
        borderBottom: '1px solid rgba(99,115,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <label
          htmlFor="snippet-select"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted, #8892b0)',
            fontFamily: 'var(--font-mono, monospace)',
            whiteSpace: 'nowrap',
          }}
        >
          Snippets:
        </label>
        <select
          id="snippet-select"
          onChange={handleSnippetChange}
          defaultValue=""
          style={{
            flex: 1,
            background: 'rgba(15, 17, 35, 0.7)',
            color: '#e2e8f0',
            border: '1px solid rgba(99,115,255,0.25)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            cursor: 'pointer',
            outline: 'none',
            maxWidth: '280px',
          }}
        >
          <option value="" disabled>Load a data structure...</option>
          {Object.entries(CODE_SNIPPETS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language="cpp"
          theme="vs-dark"
          value={code || DEFAULT_CODE}
          onChange={(value) => onCodeChange(value ?? '')}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12 },
            glyphMargin: true,
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
};

export { CodeEditor, DEFAULT_CODE };
