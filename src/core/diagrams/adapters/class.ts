import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'class',
  title: 'class',
  sample:
    'classDiagram\n class Account\n Account : +String name\n Account --> User',
  rules: [
    {
      name: 'member',
      pattern: '^(\\s*)(\\w+)(\\s*:\\s*)(.+)$',
      fields: [
        {
          group: 4,
          label: 'Member',
        },
      ],
    },
    {
      name: 'class',
      pattern: '^(\\s*class\\s+)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Class',
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
      label: 'class',
      source: ' class $id',
    },
    {
      label: 'member',
      source: ' Account : +String value',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
