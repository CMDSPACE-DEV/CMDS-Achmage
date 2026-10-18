import type { Adapter } from '../DiagramEditor'

import adapter0 from './flowchart'
import adapter3 from './gantt'
import adapter2 from './mindmap'
import adapter1 from './sequence'
export const diagramAdapters: Adapter[] = [
  adapter0,
  adapter1,
  adapter2,
  adapter3,
]
