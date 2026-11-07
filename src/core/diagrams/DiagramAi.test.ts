import { acceptProposal, proposeDiagram } from './DiagramAi'
test('requires explicit acceptance and rejects a stale proposal', async () => {
  const controller = new AbortController()
  const validate = jest.fn()
  const proposal = await proposeDiagram(
    '한국어로',
    'flowchart LR\n A --> B',
    controller.signal,
    {
      complete: async () => 'flowchart LR\n A[시작] --> B',
      validate,
    },
  )
  expect(validate).toHaveBeenCalledTimes(1)
  expect(acceptProposal(proposal, 'flowchart LR\n A --> B')).toContain('시작')
  expect(() => acceptProposal(proposal, 'changed')).toThrow('Source changed')
})
test('does not return invalid or cancelled proposals', async () => {
  const controller = new AbortController()
  await expect(
    proposeDiagram('draw', '', controller.signal, {
      complete: async () => 'invalid',
      validate: () => {
        throw new Error('Parse error')
      },
    }),
  ).rejects.toThrow('Parse error')
  controller.abort()
  await expect(
    proposeDiagram('draw', '', controller.signal, {
      complete: async () => 'flowchart LR',
      validate: jest.fn(),
    }),
  ).rejects.toThrow('cancelled')
})
