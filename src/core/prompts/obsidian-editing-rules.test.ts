import {
  OBSIDIAN_EDITING_RULES,
  OBSIDIAN_EDITING_RULES_DOC_URL,
} from './obsidian-editing-rules'

describe('OBSIDIAN_EDITING_RULES', () => {
  it('states both indentation rules, which are the pair that gets confused', () => {
    expect(OBSIDIAN_EDITING_RULES).toContain('TWO SPACES')
    expect(OBSIDIAN_EDITING_RULES).toContain('TABS')
  })

  it('covers every rule the settings toggle promises', () => {
    for (const topic of [
      'frontmatter',
      'wikilink',
      'callout',
      'table',
      'Mermaid',
    ]) {
      expect(OBSIDIAN_EDITING_RULES.toLowerCase()).toContain(
        topic.toLowerCase(),
      )
    }
  })

  it('points at a document in this repository', () => {
    expect(OBSIDIAN_EDITING_RULES_DOC_URL).toBe(
      'https://github.com/CMDSPACE-DEV/CMDS-Achmage/blob/main/docs/obsidian-editing-rules.md',
    )
  })
})
