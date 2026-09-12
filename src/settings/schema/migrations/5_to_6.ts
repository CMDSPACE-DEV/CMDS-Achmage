import { PROVIDER_TYPES_INFO } from '../../../constants'
import { SettingMigration } from '../setting.types'

import { asObjectRecords, recordId } from './migrationUtils'

/**
 * Migration from version 5 to version 6
 * - Remove deprecated 'streamingDisabled' property from OpenAI models
 * - Add 'reasoning_effort' property for OpenAI reasoning models (o1, o1-mini, o3-mini)
 * - Add o3-mini as default model
 */
export const migrateFrom5To6: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 6

  // Remove deprecated 'streamingDisabled' property from OpenAI models
  if ('chatModels' in newData && Array.isArray(newData.chatModels)) {
    newData.chatModels = asObjectRecords(newData.chatModels).map((model) => {
      if (model.providerType === 'openai' && 'streamingDisabled' in model) {
        const { streamingDisabled: _streamingDisabled, ...rest } = model
        return rest
      }
      return model
    })
  }

  // Add 'reasoning_effort' property for OpenAI reasoning models (o1, o1-mini, o3-mini)
  if ('chatModels' in newData && Array.isArray(newData.chatModels)) {
    newData.chatModels = asObjectRecords(newData.chatModels).map((model) => {
      if (
        model.providerType === 'openai' &&
        typeof model.model === 'string' &&
        ['o1', 'o1-mini', 'o3-mini'].includes(model.model)
      ) {
        return {
          ...model,
          reasoning_effort: 'medium',
        }
      }
      return model
    })
  }

  // Add o3-mini as default model
  if ('chatModels' in newData && Array.isArray(newData.chatModels)) {
    let chatModels = asObjectRecords(newData.chatModels)
    const existingModelsMap = new Map(
      chatModels.map((model) => [recordId(model), model]),
    )

    const newModel: Record<string, unknown> = {
      providerType: 'openai',
      providerId: PROVIDER_TYPES_INFO.openai.defaultProviderId,
      id: 'o3-mini',
      model: 'o3-mini',
      reasoning_effort: 'medium',
    }

    // override existing model with same id
    const existingModel = existingModelsMap.get(recordId(newModel))
    if (existingModel) {
      // Remove the existing model from the array
      chatModels = chatModels.filter(
        (model) => recordId(model) !== recordId(newModel),
      )
    }

    // Find the index of the model with id 'o1'
    const o1Index = chatModels.findIndex((model) => recordId(model) === 'o1')
    const insertIndex = o1Index !== -1 ? o1Index + 1 : 0
    chatModels.splice(insertIndex, 0, newModel)
    newData.chatModels = chatModels
  }

  return newData
}
