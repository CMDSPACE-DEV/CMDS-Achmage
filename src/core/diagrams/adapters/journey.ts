import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'journey',
  title: 'journey',
  sample: 'journey\n section Work\n 시작: 3: Me\n End: 5: Me',
  rules: [
    {
      name: 'task',
      pattern: '^(\\s*)([^:]+)(:\\s*)(\\d+)(:\\s*)([^:]+)$',
      fields: [
        {
          group: 2,
          label: 'Task',
        },
        {
          group: 4,
          label: 'Score',
          numeric: true,
        },
        {
          group: 6,
          label: 'Actors',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'task',
      source: ' New: 3: Me',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
