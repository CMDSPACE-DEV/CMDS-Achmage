import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'mindmap',
  title: 'mindmap',
  sample: 'mindmap\n  root\n    시작\n    End',
  rules: [
    {
      name: 'branch',
      pattern: '^([ \\t]+)([^%\\s][^\\r\\n]*?)([ \\t]*)$',
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
      label: 'branch',
      source: '    New',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
