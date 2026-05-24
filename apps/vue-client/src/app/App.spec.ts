import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';

/**
 * App integration test.
 *
 * US-01: The Data Table renders from columns and data props.
 * US-08: Domain-agnostic — the component renders for any dataset shape.
 */
describe('App', () => {
  it('US-01: renders a Data Table', () => {
    const wrapper = mount(App);
    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.findAll('tr').length).toBeGreaterThan(1);
  });
});
