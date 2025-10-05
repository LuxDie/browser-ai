// Options page script para Browser AI
// Maneja la configuración de la extensión

interface Settings {
  defaultTargetLanguage: string
  privacyMode: boolean
}

// Elementos del DOM
const elements = {
  defaultLanguageSelect: document.getElementById('default-language') as HTMLSelectElement,
  privacyModeCheckbox: document.getElementById('privacy-mode') as HTMLInputElement,
  saveButton: document.getElementById('save-settings') as HTMLButtonElement,
  resetButton: document.getElementById('reset-settings') as HTMLButtonElement,
  saveMessage: document.getElementById('save-message') as HTMLDivElement,
  translatorStatus: document.getElementById('translator-status') as HTMLParagraphElement,
  detectorStatus: document.getElementById('detector-status') as HTMLParagraphElement
}

// Cargar configuración guardada
const loadSettings = async (): Promise<void> => {
  try {
    const result = await chrome.storage.local.get([
      'defaultTargetLanguage',
      'privacyMode',
      'translatorAPIAvailable',
      'languageDetectorAPIAvailable'
    ]) as { 
      defaultTargetLanguage: string, 
      privacyMode: boolean, 
      translatorAPIAvailable: boolean, 
      languageDetectorAPIAvailable: boolean 
    }

    // Configurar valores por defecto
    elements.defaultLanguageSelect.value = result.defaultTargetLanguage ?? 'es'
    elements.privacyModeCheckbox.checked = result.privacyMode ?? false

    // Actualizar estado de las APIs
    updateAPIStatus(
      result.translatorAPIAvailable,
      result.languageDetectorAPIAvailable
    )
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

// Guardar configuración
const saveSettings = async (): Promise<void> => {
  try {
    const settings: Settings = {
      defaultTargetLanguage: elements.defaultLanguageSelect.value,
      privacyMode: elements.privacyModeCheckbox.checked
    }

    await chrome.storage.local.set(settings)
    showSaveMessage()
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// Restaurar configuración predeterminada
const resetSettings = async (): Promise<void> => {
  try {
    elements.defaultLanguageSelect.value = 'es'
    elements.privacyModeCheckbox.checked = false
    await saveSettings()
  } catch (error) {
    console.error('Error resetting settings:', error)
  }
}

// Mostrar mensaje de confirmación
const showSaveMessage = (): void => {
  elements.saveMessage.classList.remove('hidden')
  setTimeout(() => {
    elements.saveMessage.classList.add('hidden')
  }, 3000)
}

// Actualizar estado de las APIs
const updateAPIStatus = (translatorAvailable?: boolean, detectorAvailable?: boolean): void => {
  if (translatorAvailable !== undefined) {
    elements.translatorStatus.textContent = `• Translator API: ${
      translatorAvailable ? '✅ Disponible' : '❌ No disponible'
    }`
  }

  if (detectorAvailable !== undefined) {
    elements.detectorStatus.textContent = `• Language Detector API: ${
      detectorAvailable ? '✅ Disponible' : '❌ No disponible'
    }`
  }
}

// Verificar disponibilidad de APIs
const checkAPIAvailability = async (): Promise<void> => {
  try {
    // Verificar APIs en el contexto de la extensión
    const hasTranslatorAPI = 'translator' in chrome
    const hasLanguageDetectorAPI = 'languageDetector' in chrome

    updateAPIStatus(hasTranslatorAPI, hasLanguageDetectorAPI)

    // Guardar estado en storage
    await chrome.storage.local.set({
      translatorAPIAvailable: hasTranslatorAPI,
      languageDetectorAPIAvailable: hasLanguageDetectorAPI
    })
  } catch (error) {
    console.error('Error checking API availability:', error)
    updateAPIStatus(false, false)
  }
}

// Event listeners
elements.saveButton.addEventListener('click', () => { void saveSettings() })
elements.resetButton.addEventListener('click', () => { void resetSettings() })

// Cargar configuración al inicializar
document.addEventListener('DOMContentLoaded', () => {
  void loadSettings()
  void checkAPIAvailability()
})

export {}
