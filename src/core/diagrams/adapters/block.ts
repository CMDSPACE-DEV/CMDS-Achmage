import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'block',
  title: 'block',
  sample: 'block-beta\n columns 2\n A["시작"]\n B["End"]\n A --> B',
  rules: [
    {
      name: 'node',
      pattern: '^(\\s*)([A-Za-z]\\w*)(\\["?)([^"\\]]+)("?\\]\\s*)$',
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
      label: 'block',
      source: ' $id["New"]',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
