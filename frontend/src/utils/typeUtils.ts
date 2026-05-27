export const cleanType = (t: string): string => {
  if (!t) return '';
  let prev = '';
  let curr = t.trim();
  while (curr !== prev) {
    prev = curr;
    curr = curr.replace(/^(const|volatile|class|struct)\s+/, '');
    curr = curr.replace(/^::/, '');
    curr = curr.trim();
  }
  return curr;
};

export const isSTLType = (type: string): boolean => {
  if (!type) return false;
  const clean = cleanType(type);
  return clean.startsWith('std::vector') ||
         clean.startsWith('std::map') ||
         clean.startsWith('std::unordered_map') ||
         clean.startsWith('std::set') ||
         clean.startsWith('std::unordered_set') ||
         clean.startsWith('std::list') ||
         clean.startsWith('std::deque') ||
         clean.startsWith('std::stack') ||
         clean.startsWith('std::queue') ||
         clean.startsWith('std::priority_queue') ||
         clean.startsWith('std::pair') ||
         clean.startsWith('std::array');
};

export const getBaseType = (type: string): string => {
  const clean = cleanType(type);
  const ltIdx = clean.indexOf('<');
  if (ltIdx >= 0) {
    return clean.slice(0, ltIdx);
  }
  const bracketIdx = clean.indexOf('[');
  if (bracketIdx >= 0) {
    return clean.slice(0, bracketIdx) + '[]';
  }
  return clean;
};

function parseTemplateArgs(clean: string): string[] {
  const startIdx = clean.indexOf('<');
  const endIdx = clean.lastIndexOf('>');
  if (startIdx < 0 || endIdx <= startIdx) return [];

  const content = clean.slice(startIdx + 1, endIdx);
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '<') depth++;
    else if (ch === '>') depth--;
    else if (ch === ',' && depth === 0) {
      args.push(content.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (start < content.length) {
    args.push(content.slice(start).trim());
  }
  return args;
}

const containerKeepArgs: Record<string, number> = {
  'std::map': 2,
  'std::unordered_map': 2,
  'std::set': 1,
  'std::unordered_set': 1,
  'std::vector': 1,
  'std::list': 1,
  'std::deque': 1,
  'std::stack': 1,
  'std::queue': 1,
  'std::priority_queue': 1,
  'std::pair': 2,
};

export const shortenSTLType = (t: string): string => {
  if (!t) return '';
  // Replace std::__cxx11:: → empty
  let s = t.replace(/std::__cxx11::/g, 'std::');
  // Replace basic_string<...> → string
  s = s.replace(/std::basic_string<char,\s*std::char_traits<char>,\s*std::allocator<char>\s*>/g, 'std::string');
  s = s.replace(/std::basic_string<char>/g, 'std::string');
  return s;
};

export const getCleanSTLTypeName = (type: string): string => {
  if (!type) return '';

  // First pass: shorten known verbose patterns
  const clean = shortenSTLType(type);

  // Find the container name (everything before the first <)
  const base = getBaseType(clean);

  // Only process known STL containers
  if (containerKeepArgs[base] === undefined) {
    return cleanType(clean);
  }

  const keepCount = containerKeepArgs[base];
  const args = parseTemplateArgs(clean);

  if (args.length < keepCount) {
    return cleanType(clean);
  }

  const kept = args.slice(0, keepCount).join(', ');
  return `${base}<${kept}>`;
};
