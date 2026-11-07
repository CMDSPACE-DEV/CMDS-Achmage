import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'packet',
  title: 'packet',
  sample: 'packet-beta\n 0-7: "시작"\n 8-15: "End"',
  rules: [
    {
      name: 'field',
      pattern: '^(\\s*)(\\d+)(-)(\\d+)(:\\s*")([^"]+)("\\s*)$',
      fields: [
        {
          group: 6,
          label: 'Label',
        },
        {
          group: 2,
          label: 'First bit',
          numeric: true,
        },
        {
          group: 4,
          label: 'Last bit',
          numeric: true,
        },
      ],
    },
  ],
  additions: [
    {
      label: 'field',
      source: ' 16-23: "New"',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
