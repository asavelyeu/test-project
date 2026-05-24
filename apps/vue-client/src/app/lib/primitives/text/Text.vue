<script setup lang="ts">
/**
 * Text primitive — the minimal, indivisible building block for inline text content.
 *
 * Renders `text` prop inside a <span> when provided; falls back to the default
 * slot so callers can project content. Owns no layout opinion — styling (e.g.
 * `truncate`) is applied by the consuming molecule via class forwarding.
 *
 * Layer: lib/primitives — more fundamental than an atom; genuinely indivisible.
 *
 * Vue note: `text` prop takes precedence; slot renders when `text` is absent.
 * Callers forward Tailwind utility classes via the standard Vue fallthrough
 * attribute mechanism (no explicit class prop needed).
 */
defineProps<{ text?: string }>();
</script>

<template>
  <span><template v-if="text != null">{{ text }}</template><slot v-else /></span>
</template>
