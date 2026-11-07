import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'state',
  title: 'state',
  sample: 'stateDiagram-v2\n state "시작" as A\n A --> B',
  rules: [
    {
      name: 'state',
      pattern: '^(\\s*state\\s+")([^"]+)("\\s+as\\s+)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Label',
        },
      ],
      keyGroup: 4,
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
      label: 'state',
      source: ' state "New" as $id',
    },
    {
      label: 'transition',
      source: ' A --> B',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
