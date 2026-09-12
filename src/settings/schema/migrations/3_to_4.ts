import { PROVIDER_TYPES_INFO } from '../../../constants'
import { SettingMigration } from '../setting.types'

import { asObjectRecords, recordId } from './migrationUtils'

export const migrateFrom3To4: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 4

  // Handle chat models migration
  if ('chatModels' in newData && Array.isArray(newData.chatModels)) {
    let chatModels = asObjectRecords(newData.chatModels)
    const existingModelsMap = new Map(
      chatModels.map((model) => [recordId(model), model]),
    )

    let newModel: Record<string, unknown> = {
      providerType: 'anthropic',
      providerId: PROVIDER_TYPES_INFO.anthropic.defaultProviderId,
      id: 'claude-3.7-sonnet',
      model: 'claude-3-7-sonnet-latest',
    }

    // override existing model with same id
    const existingModel = existingModelsMap.get(String(newModel.id))
    if (existingModel) {
      // keep the existing model settings
      newModel = Object.assign(existingModel, newModel)
      // Remove the existing model from the array
      chatModels = chatModels.filter(
        (model) => recordId(model) !== recordId(newModel),
      )
    }
    // Add the new model at index 0 of the array
    chatModels.splice(0, 0, newModel)
    newData.chatModels = chatModels
  }
  return newData
}
