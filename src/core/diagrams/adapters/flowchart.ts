import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'flowchart',
  title: 'flowchart',
  sample: 'flowchart LR\n A[시작]\n B[End]\n A --> B',
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
    {
      name: 'edge',
      pattern: '^(\\s*)(\\w+)(\\s*-->\\s*)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'From',
        },
        {
          group: 4,
          label: 'To',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'node',
      source: ' $id[New]',
    },
    {
      label: 'edge',
      source: ' A --> B',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
