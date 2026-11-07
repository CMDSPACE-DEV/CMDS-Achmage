import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'sankey',
  title: 'sankey',
  sample: 'sankey-beta\nSource,Target,10\nTarget,End,5',
  rules: [
    {
      name: 'flow',
      pattern: '^()([^,]+)(,)([^,]+)(,)([\\d.]+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'From',
        },
        {
          group: 4,
          label: 'To',
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
      label: 'flow',
      source: 'Source,$id,3',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
