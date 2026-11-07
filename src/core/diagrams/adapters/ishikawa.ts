import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'ishikawa',
  title: 'ishikawa',
  sample: 'ishikawa-beta\n Problem\n   Process\n     Cause\n   People',
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
      label: 'cause',
      source: '     New',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
