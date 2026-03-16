export const SELECTED_MODEL_STORAGE_KEY = "copilot-chat-playground:selected-model"

function getDefaultStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readStoredSelectedModel(storage?: Storage): string | undefined {
  const targetStorage = storage ?? getDefaultStorage()
  if (!targetStorage) {
    return undefined
  }

  try {
    const raw = targetStorage.getItem(SELECTED_MODEL_STORAGE_KEY)?.trim()
    return raw ? raw : undefined
  } catch {
    return undefined
  }
}

export function writeStoredSelectedModel(
  model: string | undefined,
  storage?: Storage
): boolean {
  const targetStorage = storage ?? getDefaultStorage()
  if (!targetStorage) {
    return false
  }

  try {
    if (model?.trim()) {
      targetStorage.setItem(SELECTED_MODEL_STORAGE_KEY, model)
    } else {
      targetStorage.removeItem(SELECTED_MODEL_STORAGE_KEY)
    }
    return true
  } catch {
    return false
  }
}