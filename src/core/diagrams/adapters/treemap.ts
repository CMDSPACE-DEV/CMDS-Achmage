import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'treemap',
  title: 'treemap',
  sample: 'treemap-beta\n "Root"\n   "시작": 10\n   "End": 20',
  rules: [
    {
      name: 'leaf',
      pattern: '^(\\s*")([^"]+)("\\s*:\\s*)([\\d.]+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Label',
        },
        {
          group: 4,
          label: 'Value',
          numeric: true,
        },
      ],
    },
    {
      name: 'item',
      pattern: '^(\\s*")([^"]+)("\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Label',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'leaf',
      source: '   "$id": 5',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
