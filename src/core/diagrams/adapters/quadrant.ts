import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'quadrantChart',
  title: 'quadrant',
  sample: 'quadrantChart\n 시작: [0.2, 0.3]\n End: [0.7, 0.8]',
  rules: [
    {
      name: 'point',
      pattern: '^(\\s*)([^:]+)(:\\s*\\[)([\\d.]+)(,\\s*)([\\d.]+)(\\]\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Label',
        },
        {
          group: 4,
          label: 'X',
          numeric: true,
        },
        {
          group: 6,
          label: 'Y',
          numeric: true,
        },
      ],
    },
  ],
  additions: [
    {
      label: 'point',
      source: ' $id: [0.5, 0.5]',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
