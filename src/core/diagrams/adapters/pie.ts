import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'pie',
  title: 'pie',
  sample: 'pie\n "시작" : 20\n "End" : 30',
  rules: [
    {
      name: 'slice',
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
  ],
  additions: [
    {
      label: 'slice',
      source: ' "$id" : 10',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
