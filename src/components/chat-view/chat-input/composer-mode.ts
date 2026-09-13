export type ComposerMode = 'chat' | 'vault' | 'image' | 'edit'

export function toggleComposerMode(
  currentMode: ComposerMode,
  requestedMode: Exclude<ComposerMode, 'chat'>,
): ComposerMode {
  return currentMode === requestedMode ? 'chat' : requestedMode
}

export function getComposerSubmission(mode: ComposerMode): {
  useVaultSearch: boolean
  mode: 'chat' | 'image' | 'edit'
} {
  return {
    useVaultSearch: mode === 'vault',
    mode: mode === 'image' ? 'image' : mode === 'edit' ? 'edit' : 'chat',
  }
}

export function getComposerSendLabel(
  mode: ComposerMode,
  foregroundPending: boolean,
): string {
  if (mode === 'image') {
    return 'Add image generation to queue'
  }
  if (mode === 'edit') {
    return 'Ask for note edits'
  }
  if (foregroundPending) {
    return 'Add prompt to queue'
  }
  if (mode === 'vault') {
    return 'Send with vault search'
  }
  return 'Send message'
}
