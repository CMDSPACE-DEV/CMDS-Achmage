import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'radar',
  title: 'radar',
  sample: 'radar-beta\n axis A, B, C\n curve start{1, 2, 3}',
  rules: [
    {
      name: 'axis',
      pattern: '^(\\s*axis\\s+)(.+)$',
      fields: [
        {
          group: 2,
          label: 'Axes',
        },
      ],
    },
    {
      name: 'curve',
      pattern: '^(\\s*curve\\s+)(\\w+)(\\s*\\{)([^}]+)(\\}\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Series',
        },
        {
          group: 4,
          label: 'Values',
        },
      ],
      keyGroup: 2,
    },
  ],
  additions: [
    {
      label: 'series',
      source: ' curve $id{2, 3, 4}',
    },
  ],
  editValue: 'X, Y, Z',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
