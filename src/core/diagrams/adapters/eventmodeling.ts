import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'eventmodeling',
  title: 'eventmodeling',
  sample: 'eventmodeling\n tf 01 cmd Start\n tf 02 evt End',
  rules: [
    {
      name: 'event',
      pattern:
        '^(\\s*tf\\s+)(\\d+)(\\s+)(cmd|evt|ui|rmo|pcr)(\\s+)([\\w.]+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Timeframe',
        },
        {
          group: 4,
          label: 'Kind',
        },
        {
          group: 6,
          label: 'Name',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'event',
      source: ' tf 03 evt $id',
    },
  ],
  editValue: '03',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
