import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'er',
  title: 'er',
  sample:
    'erDiagram\n CUSTOMER {\n  string name\n }\n CUSTOMER ||--o{ ORDER : owns',
  rules: [
    {
      name: 'attribute',
      pattern: '^(\\s+)(\\w+)(\\s+)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Type',
        },
        {
          group: 4,
          label: 'Name',
        },
      ],
    },
    {
      name: 'relation',
      pattern:
        '^(\\s*)(\\w+)(\\s+)([|o}{.-]+)(\\s+)(\\w+)(\\s*:\\s*)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'From',
        },
        {
          group: 4,
          label: 'Cardinality',
        },
        {
          group: 6,
          label: 'To',
        },
        {
          group: 8,
          label: 'Label',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'entity',
      source: ' $id {\n  string name\n }',
    },
  ],
  editValue: 'int',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
