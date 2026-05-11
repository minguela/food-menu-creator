# Available Agents

This project has specialized agents for different areas:

## .opencode/agents/

| Agent | Description |
|-------|-------------|
| `telegram-bot.md` | Telegram Bot development with Supabase Edge Functions |
| `supabase-edge-functions.md` | Supabase Edge Functions (Deno/TypeScript) |
| `nuxt-frontend.md` | Nuxt 3 + Vue 3 frontend development |

## .agents/skills/

| Skill | Description |
|-------|-------------|
| `accessibility` | Audit and improve web accessibility (WCAG 2.2) |
| `bash-defensive-patterns` | Defensive Bash programming for production scripts |
| `frontend-design` | Create distinctive frontend interfaces |
| `seo` | Search engine optimization |
| `find-skills` | Discover and install agent skills from the ecosystem |

## Usage

Agents are automatically loaded based on the task context. Skills are loaded from `.agents/skills/` directory.

Use the `skill` tool to load a skill when the task matches its description.

## Context Files

- `PROJECT_CONTEXT.md` - Full project documentation
- `architecture.md` - Architecture details
- `openspec/config.yaml` - OpenSpec configuration with project context