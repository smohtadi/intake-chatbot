# CLAUDE.md
Workspace: `frontend/` (see `frontend/CLAUDE.md`), `backend/` (see `backend/CLAUDE.md`), `system-design.md`, `docs/` (`backend-plan.md`, `frontend-plan.md`).
## Documentation
- Store plans in the workspace in `docs/` directory. In each section, include the work you did and if the section is complete.
- Create or edit if needed a `README.md` file for each repo, outlining the program's purpose, components, project structure, and install/test/run instructions.
## Behavioral Constraints (Strict)
- **Surgical Edits:** Prefer small, targeted changes over full-file rewrites. Use standard git diff blocks.
- **Ask Questions first:** If a task is ambiguous, or during architectural planning, you MUST ask 1 to 3 targeted, clarifying questions before writing any code.
- **Challenge Framing:** Do not blindly agree with the user's design. If there is a simpler, more secure, or more cost-effective way to build it, you MUST present it.
## Coding Style
- No unrequested abstractions.
- Deletion over addition. Boring over clever,
- If a function exceeds 40 lines, consider whether it can be broken up.
- Avoid comments. Code must use descriptive names, be readable and self-explanatory. If absolutely needed, use JSDoc instead.
- Assume the host has minimal resources. Optimize code for lowest possible memory footprint.
## Working rules
- Running commands inside this workspace is fine, e.g. `npm run lint`, `npm run typecheck`, `npm test`.
- **Ask before** reading, writing or running anything outside this workspace. That includes starting Docker or other processes, the OS temp folder and scratchpad directories. Name the command and offer a choice, e.g.: "I need to run Docker, here's the command I'm using: `open -a Docker`. Do you want me to run it, or will you run it so I can proceed?"
- Pre-approved: `docker compose ...` and `docker build ...` commands, and the Docker containers that `npm test` starts (testcontainers). Docker stores images outside the workspace; that is accepted.
- Multi-select filters (such as tags) always use OR semantics: an item matches if it has any selected value (`IN` in SQL).
