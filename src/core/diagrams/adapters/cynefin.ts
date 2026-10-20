import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'cynefin',
  title: 'cynefin',
  sample: 'cynefin-beta\n complex\n "시작"\n clear\n "End"',
  rules: [
    {
      name: 'item',
      pattern: '^(\\s*")([^"]+)("\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Label',
        },
      ],
    },
    {
      name: 'domain',
      pattern: '^(\\s*)(complex|complicated|clear|chaotic|confusion)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Domain',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'item',
      source: ' "New"',
    },
  ],
  editValue: 'complicated',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
