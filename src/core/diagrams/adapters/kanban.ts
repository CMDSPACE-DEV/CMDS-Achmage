import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'kanban',
  title: 'kanban',
  sample: 'kanban\n Todo[To do]\n  a[시작]\n  b[End]',
  rules: [
    {
      name: 'node',
      pattern: '^(\\s*)([A-Za-z]\\w*)(\\[)([^\\]]+)(\\]\\s*)$',
      fields: [
        {
          group: 4,
          label: 'Label',
        },
      ],
      keyGroup: 2,
    },
  ],
  additions: [
    {
      label: 'card',
      source: '  $id[New]',
    },
    {
      label: 'column',
      source: ' $id[Column]',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
