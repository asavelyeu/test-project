<script setup lang="ts" generic="TRow">
/**
 * Text Cell — molecule that renders a plain-text value inside the Text primitive.
 *
 * Layer: lib/molecules/cells — a focused composition of a primitive serving one role
 * (the Text Cell renderer). Canonical name per CLAUDE.md §4.
 *
 * `value` is typed `unknown` because the cell-type registry receives it from the
 * generic row type at runtime; this molecule coerces to string so the Text primitive
 * always receives a string or empty string.
 *
 * `column` and `row` are accepted for forward compatibility with multi-field cells
 * and Text-specific column options (truncate vs wrap, maxLines) that will live on
 * TextColumnConfig in a later ticket.
 *
 * Truncation: `truncate` class applied to the Text primitive wrapper so long values
 * are clipped with an ellipsis. Matches the React Text Cell and ui-ux-expectations.md
 * default truncation behavior.
 */
import { computed } from 'vue';
import type { ColumnConfig } from '@test-project/data-table';
import Text from '../../../primitives/text/Text.vue';

const props = defineProps<{
  value: unknown;
  column?: ColumnConfig<TRow>;
  row?: TRow;
}>();

// Derive display value — coerce to string, never derive in template (reactivity.md).
const displayValue = computed(() => (props.value == null ? '' : String(props.value)));
</script>

<template>
  <!-- Text Cell — truncate applies overflow-hidden + text-overflow:ellipsis + white-space:nowrap -->
  <Text :text="displayValue" class="truncate" />
</template>
