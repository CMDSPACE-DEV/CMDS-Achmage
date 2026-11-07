import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'wardley',
  title: 'wardley',
  sample:
    'wardley-beta\n component Start [0.5, 0.5]\n component End [0.2, 0.8]\n Start -> End',
  rules: [
    {
      name: 'component',
      pattern:
        '^(\\s*component\\s+)(\\w+)(\\s+\\[)([\\d.]+)(,\\s*)([\\d.]+)(\\]\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Name',
        },
        {
          group: 4,
          label: 'Visibility',
          numeric: true,
        },
        {
          group: 6,
          label: 'Evolution',
          numeric: true,
        },
      ],
      keyGroup: 2,
    },
    {
      name: 'relation',
      pattern: '^(\\s*)(\\w+)(\\s*->\\s*)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'From',
        },
        {
          group: 4,
          label: 'To',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'component',
      source: ' component $id [0.5, 0.5]',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
