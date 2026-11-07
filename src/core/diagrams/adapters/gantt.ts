import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'gantt',
  title: 'gantt',
  sample:
    'gantt\n dateFormat YYYY-MM-DD\n section Work\n 시작 :a, 2026-01-01, 3d',
  rules: [
    {
      name: 'task',
      pattern:
        '^(\\s*)([^:]+?)(\\s*:\\s*)(\\w+)(,\\s*)(\\d{4}-\\d{2}-\\d{2})(,\\s*)(\\d+d)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Task',
        },
        {
          group: 6,
          label: 'Start date',
        },
        {
          group: 8,
          label: 'Duration',
        },
      ],
      keyGroup: 4,
    },
  ],
  additions: [
    {
      label: 'task',
      source: ' New :$id, 2026-01-05, 2d',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
