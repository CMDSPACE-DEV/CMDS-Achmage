import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'c4',
  title: 'c4',
  sample:
    'C4Context\n Person(user, "시작", "Person")\n System(app, "App", "System")\n Rel(user, app, "Uses")',
  rules: [
    {
      name: 'element',
      pattern:
        '^(\\s*)(Person|System)(\\()(\\w+)(,\\s*")([^"]+)(",\\s*")([^"]+)("\\)\\s*)$',
      fields: [
        {
          group: 6,
          label: 'Label',
        },
        {
          group: 8,
          label: 'Description',
        },
      ],
      keyGroup: 4,
    },
    {
      name: 'relation',
      pattern: '^(\\s*Rel\\()(\\w+)(,\\s*)(\\w+)(,\\s*")([^"]+)("\\)\\s*)$',
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
          label: 'Label',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'person',
      source: ' Person($id, "New", "Person")',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
