'use strict';

/**
 * eslint-plugin-justlife
 *
 * Governance rules that keep the design system free of arbitrary values.
 * The flagship rule, `no-raw-values`, forbids hard-coded colours and raw
 * dimension numbers inside component/pattern source. Everything visual must
 * come from `@justlife/tokens`.
 */

// #rgb, #rgba, #rrggbb, #rrggbbaa
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// rgb()/rgba()/hsl()/hsla()
const FUNC_COLOR = /^(?:rgb|rgba|hsl|hsla)\s*\(/i;

// Allowed non-token colour keywords (semantically safe, platform-neutral).
const ALLOWED_COLOR_KEYWORDS = new Set(['transparent', 'currentColor', 'inherit', 'none']);

// Style props whose numeric values must reference spacing/size/radius tokens.
const DIMENSION_PROPS = new Set([
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'gap',
  'rowGap',
  'columnGap',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderWidth',
  'fontSize',
  'lineHeight',
  'letterSpacing',
]);

// Small magic numbers that are universally safe (resets / hairlines / flex).
const ALLOWED_DIMENSION_NUMBERS = new Set([0, 1]);

const noRawValues = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hard-coded colours and raw dimension values; use design tokens instead.',
    },
    schema: [],
    messages: {
      rawColor:
        'Raw colour "{{value}}" is not allowed. Use a token from @justlife/tokens (e.g. theme.color.*).',
      rawDimension:
        'Raw dimension {{value}} on "{{prop}}" is not allowed. Use a spacing/size/radius token from @justlife/tokens.',
    },
  },
  create(context) {
    function checkString(node, value) {
      if (typeof value !== 'string') return;
      if (ALLOWED_COLOR_KEYWORDS.has(value)) return;
      if (HEX_COLOR.test(value) || FUNC_COLOR.test(value)) {
        context.report({ node, messageId: 'rawColor', data: { value } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkString(node, node.value);
        }
      },
      TemplateLiteral(node) {
        // Flag template strings that begin with a hex colour, e.g. `#${x}`.
        const first = node.quasis[0];
        if (first && /^#[0-9a-fA-F]{0,8}/.test(first.value.raw) && first.value.raw.startsWith('#')) {
          context.report({ node, messageId: 'rawColor', data: { value: first.value.raw + '…' } });
        }
      },
      Property(node) {
        const key =
          node.key && (node.key.name || (node.key.type === 'Literal' && node.key.value));
        if (!key || !DIMENSION_PROPS.has(key)) return;
        const value = node.value;
        if (
          value &&
          value.type === 'Literal' &&
          typeof value.value === 'number' &&
          !ALLOWED_DIMENSION_NUMBERS.has(value.value)
        ) {
          context.report({
            node: value,
            messageId: 'rawDimension',
            data: { value: String(value.value), prop: key },
          });
        }
      },
    };
  },
};

module.exports = {
  meta: { name: 'eslint-plugin-justlife', version: '0.0.0' },
  rules: {
    'no-raw-values': noRawValues,
  },
};
