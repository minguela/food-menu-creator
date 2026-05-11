# Nuxt Best Practices - Code Review & Auto-Fix Skill

Use this skill when reviewing or fixing Nuxt 3 / Vue 3 code. It applies to the MenuPlanner project stack.

## Project Context

- **Framework**: Nuxt 4.4.4 with Vue 3.5 + TailwindCSS 6.14
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **SSR**: Vercel Edge Functions (`vercel-edge` preset)
- **Structure**: `menu-web/` is the Nuxt app root

## When to Use

Apply this skill when:
- Fixing lint/typecheck errors from `npm run lint` or `npm run build`
- Writing or reviewing Vue components in `menu-web/pages/` or `menu-web/components/`
- Writing or reviewing composables in `menu-web/composables/`
- Writing or reviewing server routes in `menu-web/server/api/`
- Writing or reviewing Supabase Edge Functions in `supabase/functions/`

## TypeScript Rules

1. **Strict types**: Use explicit types for all function parameters and return values. No implicit `any`.
2. **No `any`**: Use `unknown` with type guards when type is truly unknown. Prefer explicit interfaces over `any`.
3. **Import types**: Use `import type` for type-only imports to help tree-shaking.
4. **Null safety**: Use optional chaining (`?.`) and nullish coalescing (`??`). Avoid manual null checks.
5. **Define interfaces**: Extract repeated object shapes into named interfaces.

## Vue 3 Composition API Rules

1. **`<script setup>`**: Always use `<script setup>` syntax. Avoid Options API unless necessary.
2. **Reactivity primitives**:
   - `ref()` for primitives and mutable values
   - `reactive()` for objects
   - `computed()` for derived values (never mutate computed values)
3. **Props**: Use TypeScript defineProps:
   ```typescript
   const props = defineProps<{
     title: string;
     count?: number;
     items: string[];
   }>();
   ```
4. **Emits**: Define with defineEmits:
   ```typescript
   const emit = defineEmits<{
     (e: 'update', value: string): void;
     (e: 'delete', id: number): void;
   }>();
   ```
5. **Composables**: Place reusable logic in `composables/` with `use` prefix (e.g., `useSupabase`, `useMenu`).
6. **Lifecycle**: Use appropriate lifecycle hooks (`onMounted`, `onUnmounted`, `onServerPrefetch`).

## Nuxt-Specific Rules

1. **Auto-imports**: Nuxt auto-imports composables, components, and utils. Don't manually import them unless the auto-import isn't working.
2. **`$fetch`**: Use `$fetch` for API calls within the Nuxt app (handles SSR correctly). Use native `fetch` in server routes.
3. **Data fetching**: Prefer `useFetch` or `useAsyncData` for page/component data fetching with built-in hydration.
4. **Server routes**: Files in `server/api/` run server-side only. Create admin Supabase client with service role key.
5. **Runtime config**: Access public env vars via `useRuntimeConfig().public`.
6. **Middleware**: Route middleware in `middleware/` runs client-side; `server/middleware/` runs server-side.
7. **Plugins**: Use `plugins/` for client-side initialization (auth, third-party SDKs).

## SSR Safety Rules

1. **Browser API guards**: Always check `import.meta.client` or `process.client` before accessing `window`, `document`, `localStorage`.
2. **Lifecycle awareness**: `onMounted` only runs client-side. `onServerPrefetch` only runs server-side.
3. **Shared state**: Use `useState` (Nuxt) for state shared across SSR and client.
4. **NuxtLink**: Always use `<NuxtLink>` instead of `<a>` for internal navigation.
5. **Cookies**: Access cookies via `useCookie()` composable, not `document.cookie`.

## Error Handling Rules

1. **Composables**: Always handle errors and expose error state:
   ```typescript
   const error = ref<Error | null>(null);
   const isLoading = ref(false);
   async function fetchData() {
     isLoading.value = true;
     error.value = null;
     try {
       // ...
     } catch (e) {
       error.value = e instanceof Error ? e : new Error(String(e));
     } finally {
       isLoading.value = false;
     }
   }
   ```
2. **Async operations**: Wrap in try/catch. Show user-friendly error messages via toast/alert.
3. **Server routes**: Return appropriate HTTP status codes (200, 400, 404, 500). Log errors server-side.
4. **Edge Functions**: Always wrap the main handler in try/catch. Log errors before returning 500.

## TailwindCSS Rules

1. **Utility-first**: Use Tailwind utility classes. Avoid inline `style="..."` attributes.
2. **Responsive design**: Use breakpoints (`sm:`, `md:`, `lg:`, `xl:`) for responsive layouts.
3. **Dark mode**: Use `dark:` prefix for dark mode variants if the project uses it.
4. **Custom config**: Define custom colors, spacing, and theme extensions in `tailwind.config.js`.
5. **Color variables**: Use CSS variables from the design system when available (`text-primary`, `bg-secondary`).

## Supabase Rules

1. **Client initialization**:
   - Client-side: `useSupabaseClient()` composable
   - Server-side: Create admin client with service role key (never expose in client bundle)
2. **RLS compliance**: Respect Row Level Security. Never bypass RLS unless documented.
3. **Real-time subscriptions**: Always clean up in `onUnmounted` to prevent memory leaks:
   ```typescript
   onUnmounted(() => {
     channel.unsubscribe();
   });
   ```

## Code Style Rules

1. **No console.log**: Remove all `console.log` statements before committing. Use structured logging or Nuxt DevTools.
2. **No TODOs**: Don't leave TODO comments. Either fix the issue or create a tracking issue.
3. **Descriptive names**: Use clear, descriptive names. Follow project convention (Spanish for domain terms, English for technical terms).
4. **No magic numbers**: Extract magic numbers to named constants (e.g., `MAX_ITEMS = 100`).
5. **Single responsibility**: Keep components and functions focused on one responsibility.

## Fix Workflow

When fixing lint/typecheck errors:

1. **Parse errors**: Identify affected files and line numbers from error output.
2. **Read context**: Load the file and understand the surrounding code.
3. **Apply minimal fix**: Change only what's needed to resolve the error. Avoid unrelated refactoring.
4. **Verify fix**: Ensure the fix resolves the error without introducing new issues.
5. **Follow rules**: Apply all relevant rules above (TypeScript, Vue, SSR safety, etc.).
6. **Commit**: Use descriptive commit message: `fix: resolve TypeScript error in pages/index.vue`

## Common Fixes

- `any` type → explicit type or `unknown` with type guard
- Missing prop definition → add `defineProps<{...}>()`
- SSR-safe `window` access → add `if (import.meta.client)` guard
- Missing error handling → wrap in try/catch with error state
- Inline styles → replace with Tailwind utility classes
- Missing cleanup → add `onUnmounted` subscription cleanup