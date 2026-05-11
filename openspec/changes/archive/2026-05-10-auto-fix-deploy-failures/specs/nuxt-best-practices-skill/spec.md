# Spec: nuxt-best-practices-skill

## Overview

opencode skill that guides code review and auto-fix for Nuxt 3 / Vue 3 projects. Ensures fixes follow established patterns, conventions, and best practices specific to the MenuPlanner stack.

## Context

This skill applies to the MenuPlanner project:

- **Framework**: Nuxt 4.4.4 with Vue 3.5
- **Styling**: TailwindCSS 6.14
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **SSR**: Deploys as Vercel Edge Functions (`vercel-edge` preset)
- **API**: Nitro server routes in `menu-web/server/api/`
- **Pages**: Vue components in `menu-web/pages/`
- **Composables**: Vue composables in `menu-web/composables/`

## Rules

### TypeScript

1. **Strict mode**: Enable strict type checking. Use explicit types for function parameters and return values.
2. **No `any`**: Avoid `any` type. Use `unknown` with type guards when the type is truly unknown.
3. **Import types**: Use `import type` for type-only imports.
4. **Null handling**: Prefer optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks.

### Vue 3 Composition API

1. **`<script setup>`**: Prefer `<script setup>` syntax for all Vue components.
2. **Reactivity**: Use `ref()` for primitives, `reactive()` for objects. Use `computed()` for derived values.
3. **Props**: Define props with `defineProps` using TypeScript syntax:

   ```typescript
   const props = defineProps<{
     title: string;
     count?: number;
   }>();
   ```

4. **Emits**: Define emits with `defineEmits`:

   ```typescript
   const emit = defineEmits<{
     (e: 'update', value: string): void;
   }>();
   ```

5. **Composables**: Place reusable logic in composables under `composables/`. Use `use` prefix (e.g., `useSupabase`, `useAuth`).

### Nuxt Specifics

1. **Auto-imports**: Nuxt auto-imports composables, components, and utilities. Don't manually import them unless necessary.
2. **`$fetch`**: Use Nuxt's `$fetch` for API calls within the app (handles SSR correctly).
3. **`useFetch`**: For data fetching in pages/components, prefer `useFetch` or `useAsyncData`.
4. **Server routes**: Place API routes in `server/api/`. They run on the server only.
5. **Middleware**: Place route middleware in `middleware/` for client-side, `server/middleware/` for server-side.
6. **Runtime config**: Access public env vars via `useRuntimeConfig().public`.

### SSR Safety

1. **Browser APIs**: Check `import.meta.client` or use `process.client` before accessing browser-only APIs (`window`, `document`, `localStorage`).
2. **Lifecycle hooks**: `onMounted` only runs on client. `onServerPrefetch` runs only on server.
3. **Composables with SSR state**: Use `useState` from Nuxt for shared state that works across SSR and client.
4. **NuxtLink**: Always use `<NuxtLink>` instead of `<a>` for internal navigation.

### Error Handling

1. **Composables**: Always handle errors in composables and return meaningful error state.
2. **Async operations**: Use `try/catch` with async/await. Show user-friendly error messages.
3. **Server routes**: Return appropriate HTTP status codes. Log errors server-side.
4. **Edge Functions**: Always wrap the main handler in try/catch. Log errors before returning 500.

### TailwindCSS

1. **Utility classes**: Use Tailwind utility classes over inline styles. No `style="..."` unless dynamic.
2. **Responsive design**: Use responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
3. **Dark mode**: Support dark mode with `dark:` prefix if the project uses it.
4. **Custom config**: Use `tailwind.config.js` for custom colors, fonts, and extended theme.

### Nitro Server Routes

1. **File naming**: Use kebab-case for route files (`/server/api/user-profile.ts` → `/user-profile`).
2. **HTTP methods**: Use appropriate method suffixes or define handlers for each method in a route.
3. **Response format**: Return JSON with consistent structure `{ data, error }` or use Nuxt's `sendRedirect`/`sendError`.
4. **Authentication**: Validate JWT/service role keys in protected routes. Use Supabase admin client for server-side operations.

### Supabase

1. **Client initialization**: Use `useSupabaseClient()` composable for client-side, create admin client server-side with service role key.
2. **RLS**: Respect Row Level Security. Don't bypass RLS unless absolutely necessary and document why.
3. **Real-time**: Clean up subscriptions in `onUnmounted` to prevent memory leaks.

### Code Style

1. **No console.log**: Remove `console.log` statements. Use structured logging or Nuxt's `useNuxtApp().$logger`.
2. **No TODO comments**: Address TODOs rather than leaving them.
3. **Meaningful names**: Use descriptive variable and function names in Spanish (following project convention).
4. **No magic numbers**: Extract magic numbers to named constants.

## Fix Workflow

When fixing errors:

1. **Parse errors**: Identify the specific files and line numbers from error output.
2. **Read affected files**: Load all affected files to understand context.
3. **Apply minimal fixes**: Only change what's needed to fix the error. Avoid refactoring unrelated code.
4. **Follow rules**: Ensure each fix follows the rules above.
5. **Verify**: Check that the fix resolves the original error without introducing new ones.
6. **Commit**: Group related changes into a single commit with descriptive message.

## Anti-Patterns to Fix

- `any` types → explicit types
- `var` → `const`/`let`
- `console.log` → remove or use proper logging
- Synchronous side effects without cleanup
- Memory leaks (unclosed subscriptions, event listeners)
- Unsafe SSR patterns (direct `window` access)
- Missing error boundaries in async operations
- Inline styles instead of Tailwind classes