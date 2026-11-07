import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'gitGraph',
  title: 'git',
  sample:
    'gitGraph\n commit id: "시작"\n branch feature\n checkout feature\n commit id: "Work"',
  rules: [
    {
      name: 'commit',
      pattern: '^(\\s*commit\\s+id:\\s*")([^"]+)("\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Commit ID',
        },
      ],
    },
    {
      name: 'branch',
      pattern: '^(\\s*)(branch|checkout|merge)(\\s+)(\\w+)(\\s*)$',
      fields: [
        {
          group: 4,
          label: 'Branch',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'commit',
      source: ' commit id: "$id"',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
