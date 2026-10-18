import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'sequence',
  title: 'sequence',
  sample:
    'sequenceDiagram\n participant A as 시작\n participant B as End\n A->>B: Hello',
  rules: [
    {
      name: 'participant',
      pattern: '^(\\s*participant\\s+)(\\w+)(\\s+as\\s+)(.+)$',
      fields: [
        {
          group: 4,
          label: 'Label',
        },
      ],
      keyGroup: 2,
    },
    {
      name: 'message',
      pattern: '^(\\s*)(\\w+)(->>)(\\w+)(:\\s*)(.+)$',
      fields: [
        {
          group: 2,
          label: 'Sender',
        },
        {
          group: 4,
          label: 'Receiver',
        },
        {
          group: 6,
          label: 'Message',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'participant',
      source: ' participant $id as New',
    },
    {
      label: 'message',
      source: ' A->>B: New',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
