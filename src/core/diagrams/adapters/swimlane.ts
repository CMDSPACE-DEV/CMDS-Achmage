import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'swimlane',
  title: 'swimlane',
  sample:
    'swimlane-beta TD\n subgraph Lane\n  A[시작]\n  B[End]\n end\n A --> B',
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
    {
      name: 'lane',
      pattern: '^(\\s*subgraph\\s+)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Lane',
        },
      ],
      keyGroup: 2,
    },
  ],
  additions: [
    {
      label: 'lane',
      source: ' subgraph $id\n  $id[New]\n end',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
