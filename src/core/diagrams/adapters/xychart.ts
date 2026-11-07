import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'xychart',
  title: 'xychart',
  sample: 'xychart-beta\n x-axis [A, B]\n y-axis 0 --> 10\n bar [2, 4]',
  rules: [
    {
      name: 'series',
      pattern: '^(\\s*)(bar|line)(\\s+\\[)([^\\]]+)(\\]\\s*)$',
      fields: [
        {
          group: 4,
          label: 'Values',
        },
      ],
    },
    {
      name: 'axis',
      pattern: '^(\\s*x-axis\\s+\\[)([^\\]]+)(\\]\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Axis labels',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'series',
      source: ' line [3, 5]',
    },
  ],
  editValue: 'X, Y',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
