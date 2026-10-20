import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'usecase',
  title: 'usecase',
  sample: 'usecase-beta\n actor A(User)\n U(시작)\n A --> U',
  rules: [
    {
      name: 'actor',
      pattern: '^(\\s*actor\\s+)(\\w+)(\\()([^)]*)(\\)\\s*)$',
      fields: [
        {
          group: 4,
          label: 'Label',
        },
      ],
      keyGroup: 2,
    },
    {
      name: 'case',
      pattern: '^(\\s*)(\\w+)(\\()([^)]*)(\\)\\s*)$',
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
      label: 'case',
      source: ' $id(New)',
    },
    {
      label: 'actor',
      source: ' actor $id(New)',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
