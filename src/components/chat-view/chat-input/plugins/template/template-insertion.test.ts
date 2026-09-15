import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical'

import { $insertTemplate, matchTemplateTrigger } from './template-insertion'

describe('template slash commands', () => {
  it.each(['', 'my-template', 'meeting notes', '회의록 정리', 'v1.2_prompt'])(
    'matches /%s',
    (name) => {
      expect(matchTemplateTrigger(`Before /${name}`)).toEqual({
        leadOffset: 7,
        matchingString: name,
        replaceableString: `/${name}`,
      })
    },
  )

  it.each(['https://example.com', 'folder/file', 'no command', '/name\nnext'])(
    'does not match %s',
    (text) => expect(matchTemplateTrigger(text)).toBeNull(),
  )

  it('replaces the query with multiple paragraphs without nesting or losing surrounding text', () => {
    const editor = createEditor({
      onError: (error) => {
        throw error
      },
    })
    editor.update(
      () => {
        const first = $createParagraphNode().append(
          $createTextNode('First step'),
        )
        const second = $createParagraphNode().append(
          $createTextNode('Second step'),
        )
        const nodes = [first, second].map((node) => ({
          ...node.exportJSON(),
          children: node.getChildren().map((child) => child.exportJSON()),
        }))
        const query = $createTextNode('/my-template')
        const paragraph = $createParagraphNode().append(
          $createTextNode('Before '),
          query,
          $createTextNode(' after'),
        )
        $getRoot().append(paragraph)
        $insertTemplate(nodes, query)
        expect($getRoot().getTextContent()).toBe(
          'Before First step\n\nSecond step after',
        )
        expect($getRoot().getChildren()).toHaveLength(2)
        for (const node of $getRoot().getChildren()) {
          expect(node.getType()).toBe('paragraph')
        }
        expect(
          $getRoot()
            .getAllTextNodes()
            .map((node) =>
              node.getParentOrThrow().getParentOrThrow().getType(),
            ),
        ).toEqual(['root', 'root', 'root', 'root'])
      },
      { discrete: true },
    )
  })

  it('leaves the query intact for an empty stored template', () => {
    const editor = createEditor({
      onError: (error) => {
        throw error
      },
    })
    editor.update(
      () => {
        const query = $createTextNode('/empty')
        $getRoot().append($createParagraphNode().append(query))
        $insertTemplate([], query)
        expect($getRoot().getTextContent()).toBe('/empty')
      },
      { discrete: true },
    )
  })
})
