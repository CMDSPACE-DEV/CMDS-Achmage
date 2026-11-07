import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'railroad',
  title: 'railroad',
  sample:
    'railroad-beta\n start = terminal("시작") ;\n end = terminal("End") ;',
  rules: [
    {
      name: 'rule',
      pattern: '^(\\s*)(\\w+)(\\s*=\\s*)(.+?)(\\s*;\\s*)$',
      fields: [
        {
          group: 4,
          label: 'Expression',
        },
      ],
      keyGroup: 2,
    },
  ],
  additions: [
    {
      label: 'rule',
      source: ' $id = terminal("New") ;',
    },
  ],
  editValue: 'choice(terminal("A"), terminal("B"))',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
