import type { Adapter } from '../DiagramEditor'
const adapter: Adapter & { editValue: string } = {
  id: 'architecture',
  title: 'architecture',
  sample:
    'architecture-beta\n group cloud(cloud)[Cloud]\n service api(server)[시작] in cloud\n service db(database)[Data] in cloud\n api:R -- L:db',
  rules: [
    {
      name: 'service',
      pattern:
        '^(\\s*service\\s+)(\\w+)(\\()([^)]*)(\\)\\[)([^\\]]+)(\\]\\s+in\\s+)(\\w+)(\\s*)$',
      fields: [
        {
          group: 6,
          label: 'Label',
        },
        {
          group: 4,
          label: 'Icon',
        },
        {
          group: 8,
          label: 'Group',
        },
      ],
      keyGroup: 2,
    },
    {
      name: 'edge',
      pattern: '^(\\s*)(\\w+)(:)([LRBT])(\\s*--\\s*)([LRBT])(:)(\\w+)(\\s*)$',
      fields: [
        {
          group: 2,
          label: 'From',
        },
        {
          group: 4,
          label: 'From side',
        },
        {
          group: 6,
          label: 'To side',
        },
        {
          group: 8,
          label: 'To',
        },
      ],
    },
  ],
  additions: [
    {
      label: 'service',
      source: ' service $id(server)[New] in cloud',
    },
  ],
  editValue: 'Changed',
  limitations:
    'Recognized statements support field edits, board positioning, reorder/indent, insertion/removal and undo. Nested/extended syntax is preserved; rendered-SVG direct manipulation and advanced grammar-specific gestures remain release review work.',
}
export default adapter
