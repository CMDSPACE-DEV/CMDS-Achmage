import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'requirement',
  title: 'requirement',
  sample:
    'requirementDiagram\n requirement need {\n id: 1\n text: "시작"\n risk: low\n verifymethod: test\n }',
  rules: [
    {
      name: 'field',
      pattern: '^(\\s*)(id|text|risk|verifymethod)(:\\s*)(.+)$',
      fields: [
        {
          group: 4,
          label: 'Value',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'requirement',
      source:
        ' requirement $id {\n id: 2\n text: New\n risk: low\n verifymethod: test\n }',
    },
  ],
  editValue: '2',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
