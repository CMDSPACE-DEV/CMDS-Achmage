import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'timeline',
  title: 'timeline',
  sample: 'timeline\n 2026 : 시작\n 2027 : End',
  rules: [
    {
      name: 'event',
      pattern: '^(\\s*)([^:%]+?)(\\s*:\\s*)([^:\\r\\n]+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Period',
        },
        {
          group: 4,
          label: 'Event',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'event',
      source: ' 2028 : New',
    },
  ],
  editValue: '2030',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
