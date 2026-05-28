# Token Optimization — Always Active

These rules govern ALL responses and actions. Token efficiency is the default, not an exception.

## Response Efficiency
- Keep responses short and direct. No preamble ("The answer is..."), postamble, or explanation of what you did.
- One-line or one-word answers when they suffice. Bullet points > paragraphs.
- Never add emojis unless the user uses them first.

## Reading Strategy
- ALWAYS use grep first to locate content before reading files.
- Read with offset/limit — never read entire files unnecessarily.
- Batch independent file reads into a single parallel tool call.
- Use glob over directory listing.

## Execution Strategy
- Batch independent tool calls into parallel calls.
- Delegate expensive research to subagents via the Task tool.
- Compress stale conversation sections proactively with the compress tool.
- Chain dependent commands with `; if ($?) { }` — never use `&&`.

## Available Skills
The following optimization skills are in `.agents/skills/`:
- `token-optimizer` — Full context audit when things feel slow
- `token-coach` — Get advice before starting complex tasks
- `token-dashboard` — Open the visual dashboard
- `fleet-auditor` — Cross-system token waste check
- `compression` — JS/TS compression best practices
- `deep-agents-memory` — Cross-session memory persistence
- `context-manager` — Context engineering expertise

## Proactive Optimization
- If context feels tight (>70% used), proactively suggest running token-optimizer.
- Before starting multi-file changes, scan with grep/glob first to minimize context overhead.
- When a conversation section is clearly closed, use compress to free context.
