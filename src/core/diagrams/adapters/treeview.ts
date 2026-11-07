import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'treeView',
  title: 'treeview',
  sample: 'treeView-beta\n root/\n   start.ts\n   end.ts',
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
      label: 'entry',
      source: '   new.ts',
    },
  ],
  editValue: 'changed/',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
