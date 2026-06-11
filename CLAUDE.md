# Claude Code Project Instructions

You have access to user-level subagents installed in:
C:\Users\eminm\.claude\agents

When the user gives a task, do not behave like a single general assistant by default.

Default workflow:
1. First analyze the task type.
2. If the task is broad, multi-step, architectural, product-related, technical planning, code review, testing, documentation, strategy, finance, design, or marketing related, select the most suitable installed agent or agents.
3. If the correct agent is unclear, use agents-orchestrator first.
4. Do not modify files until you have clearly identified the agent plan, except when the user explicitly asks for direct implementation.
5. For implementation tasks, use the relevant specialist agent first, then implement.
6. For code changes, prefer this flow:
   - planning/architecture agent
   - implementation agent
   - testing agent
   - code-review agent
7. Always explain which agent or agents you used and why.
8. Keep changes minimal, controlled, and reversible.
9. Before large or risky changes, summarize the plan and wait for confirmation.
10. For simple one-step tasks, you may act directly without agent delegation.

Important:
- Prefer installed specialist agents over generic reasoning.
- Do not invent agent names. Use only agents available in the installed agent library.
- If no suitable agent exists, say that no suitable specialist agent was found and continue directly.

## Installed Agent Selection Map

Use the following installed agents by default when the task matches their domain.

Engineering / coding:
- engineering-software-architect: use for system design, project structure, architecture decisions, module boundaries, and technical planning.
- engineering-backend-architect: use for backend services, APIs, databases, server-side design, persistence, and integration planning.
- engineering-senior-developer: use for implementation of normal production code after the architecture is clear.
- engineering-rapid-prototyper: use for quick MVPs, proof-of-concepts, small apps, and first working versions.
- engineering-minimal-change-engineer: use when changing an existing codebase with the smallest safe diff.
- engineering-code-reviewer: use after code changes to review correctness, maintainability, security, and edge cases.
- engineering-technical-writer: use for README, setup docs, developer docs, and user-facing technical explanations.

Testing:
- testing-reality-checker: use to challenge assumptions, detect overengineering, and verify whether the plan is practical.
- testing-test-results-analyzer: use after tests or command outputs to interpret failures and propose fixes.
- testing-api-tester: use for API endpoint testing, request/response checks, and integration test planning.
- testing-workflow-optimizer: use for improving development workflow, task order, and automation flow.

UI / product:
- design-ux-architect: use for UX flows, screen structure, navigation, and product usability.
- engineering-frontend-developer: use for web UI implementation.
- product-manager: use for product scope, feature prioritization, MVP boundaries, and roadmap planning.

Default implementation sequence for a software task:
1. engineering-software-architect for structure and plan.
2. engineering-rapid-prototyper or engineering-senior-developer for implementation.
3. testing-reality-checker for sanity check.
4. engineering-code-reviewer for final review.
5. testing-test-results-analyzer if test output or runtime errors appear.

For small CLI apps:
1. engineering-software-architect: define CLI commands, file layout, data storage, and edge cases.
2. engineering-rapid-prototyper: create the first working version.
3. testing-reality-checker: check if the app is too complex or missing basic behavior.
4. engineering-code-reviewer: review the final code.

Strict rules:
- Use exact installed agent names from this map where possible.
- Do not invent agent names.
- If an agent is not available, say it is unavailable and choose the closest installed alternative.
- For broad tasks, use agents-orchestrator before selecting specialist agents.

## Subagent Invocation Rules

These installed files are Claude Code subagents, not skills.

Correct:
- "Use the engineering-software-architect agent to plan the CLI structure."
- "Use the engineering-rapid-prototyper agent to implement the first working version."
- "Use the engineering-code-reviewer agent to review the code."

Incorrect:
- Do not recommend `/skill engineering-rapid-prototyper`.
- Do not recommend `/skill engineering-software-architect`.
- Do not call installed subagents skills unless they are actually installed as Claude Code skills.

When suggesting the next command to the user, use natural-language subagent invocation, for example:
"Use the engineering-rapid-prototyper agent to create the first working version."

Use `/agents` only to view, create, edit, or inspect agents.

# IMPORTANT: Claude Code Agent Invocation Name Override

Claude Code must invoke subagents by their displayed agent names, not by markdown file names.

Do not invoke agents using file-style names such as:
- engineering-rapid-prototyper
- engineering-software-architect
- engineering-frontend-developer
- engineering-minimal-change-engineer
- engineering-code-reviewer
- testing-reality-checker
- testing-test-results-analyzer
- design-ux-architect
- product-manager
- agents-orchestrator

Use these displayed Claude Code agent names instead:

Core Narva Kids Code agent mapping:
- Agents Orchestrator: use for broad multi-domain planning and agent delegation.
- Reality Checker: use to challenge assumptions, reduce scope creep, and validate practicality.
- Software Architect: use for project architecture, module boundaries, technical planning, and file structure.
- UX Architect: use for child UX, onboarding flow, world map flow, level flow, and parent trust pages.
- Frontend Developer: use for React/Next.js UI, SVG renderer integration, editor UI, and page implementation.
- Rapid Prototyper: use for the first working vertical slice and playable MVP flow.
- Minimal Change Engineer: use for small, safe repairs in the current codebase.
- Senior Developer: use for production-quality implementation and refactoring after the architecture is clear.
- Code Reviewer: use after code changes to review correctness, maintainability, security, and edge cases.
- Test Results Analyzer: use when TypeScript, test, build, runtime, or validation outputs fail.
- API Tester: use only for API or integration testing.
- Workflow Optimizer: use for improving task order and development workflow.
- Technical Writer: use for README, setup docs, developer docs, and product documentation.
- Product Manager: use for product scope, MVP boundaries, prioritization, and roadmap planning.

Correct examples:
- "Use the Software Architect agent to inspect the current project structure and create a minimal P0 repair plan."
- "Use the Minimal Change Engineer agent to fix the TypeScript parser errors with the smallest safe diff."
- "Use the Test Results Analyzer agent to analyze the failed `npx tsc --noEmit` output."
- "Use the Rapid Prototyper agent to build the first playable Movement World vertical slice."
- "Use the Code Reviewer agent to review the completed changes."

Incorrect examples:
- "Use the engineering-software-architect agent..."
- "Use the engineering-rapid-prototyper agent..."
- "Use the testing-reality-checker agent..."
- "Use the engineering-code-reviewer agent..."
- "/skill engineering-rapid-prototyper"

This override is higher priority than any earlier instruction in this CLAUDE.md file that says to use exact file-style agent names.

