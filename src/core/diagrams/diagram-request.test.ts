import { matchDiagramRequest } from './diagram-request'
test('routes explicit and ordinary new diagram creation to the editor', () => {
  expect(matchDiagramRequest('/diagram 승인 절차')).toBe('승인 절차')
  expect(matchDiagramRequest('/pele flowchart')).toBe('flowchart')
  expect(matchDiagramRequest('승인 순서도를 그려줘')).toBe(
    '승인 순서도를 그려줘',
  )
  expect(matchDiagramRequest('draw a diagram')).toBe('draw a diagram')
})
test('preserves explicit Excalidraw and ordinary discussion', () => {
  expect(matchDiagramRequest('/excalidraw draw a diagram')).toBeNull()
  expect(matchDiagramRequest('엑스칼리드로 다이어그램 만들어줘')).toBeNull()
  expect(matchDiagramRequest('Pele가 무엇인가요?')).toBeNull()
})
