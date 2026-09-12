import { PROVIDER_TYPES_INFO } from '../../../constants'
import { SettingMigration } from '../setting.types'

import { asObjectRecords, recordId } from './migrationUtils'

export const migrateFrom4To5: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 5

  if ('chatModels' in newData && Array.isArray(newData.chatModels)) {
    let chatModels = asObjectRecords(newData.chatModels)
    const existingModelsMap = new Map(
      chatModels.map((model) => [recordId(model), model]),
    )

    const newModel: Record<string, unknown> = {
      providerType: 'anthropic',
      providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
      id: 'claude-3.7-sonnet-thinking',
      model: 'claude-3-7-sonnet-latest',
      thinking: {
        budget_tokens: 8192,
      },
    }

    // override existing model with same id
    const existingModel = existingModelsMap.get(recordId(newModel))
    if (existingModel) {
      // Remove the existing model from the array
      chatModels = chatModels.filter(
        (model) => recordId(model) !== recordId(newModel),
      )
    }
    // Add the new model at index 1 of the array
    chatModels.splice(1, 0, newModel)
    newData.chatModels = chatModels
  }
  return newData
}
