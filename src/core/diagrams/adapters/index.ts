import type { Adapter } from '../DiagramEditor'

import adapter4 from './class'
import adapter5 from './er'
import adapter0 from './flowchart'
import adapter3 from './gantt'
import adapter2 from './mindmap'
import adapter1 from './sequence'
import adapter6 from './state'
export const diagramAdapters: Adapter[] = [
  adapter0,
  adapter1,
  adapter2,
  adapter3,
  adapter4,
  adapter5,
  adapter6,
]
