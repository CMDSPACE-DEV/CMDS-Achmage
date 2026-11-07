import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'venn',
  title: 'venn',
  sample:
    'venn-beta\n set A["시작"]:20\n set B["End"]:15\n union A,B["Both"]:5',
  rules: [
    {
      name: 'set',
      pattern: '^(\\s*set\\s+)(\\w+)(\\["?)([^"\\]]+)("?\\]:)([\\d.]+)(\\s*)$',
      fields: [
        {
          group: 4,
          label: 'Label',
        },
        {
          group: 6,
          label: 'Value',
          numeric: true,
        },
      ],
      keyGroup: 2,
    },
    {
      name: 'union',
      pattern:
        '^(\\s*union\\s+)([\\w,]+)(\\["?)([^"\\]]+)("?\\]:)([\\d.]+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'Membership',
        },
        {
          group: 4,
          label: 'Label',
        },
        {
          group: 6,
          label: 'Value',
          numeric: true,
        },
      ],
    },
  ],
  additions: [
    {
      label: 'set',
      source: ' set $id["New"]:10',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
