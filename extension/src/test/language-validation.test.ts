import { describe, it, expect } from 'vitest'
import { 
  isValidLanguageCodeFormat,
  validateLanguagePair,
  shouldRenderWithLanguages
} from '../core'

describe('Language Code Validation', () => {

  it('should only accept 2-letter language codes (ISO 639-1)', () => {
    // Valid formats (exactly 2 letters)
    expect(isValidLanguageCodeFormat('en')).toBe(true)
    expect(isValidLanguageCodeFormat('ES')).toBe(true)
    expect(isValidLanguageCodeFormat('zh')).toBe(true)
    expect(isValidLanguageCodeFormat('fr')).toBe(true)
    expect(isValidLanguageCodeFormat('de')).toBe(true)
    expect(isValidLanguageCodeFormat('it')).toBe(true)
    expect(isValidLanguageCodeFormat('pt')).toBe(true)
    expect(isValidLanguageCodeFormat('ja')).toBe(true)
    expect(isValidLanguageCodeFormat('ko')).toBe(true)
    expect(isValidLanguageCodeFormat('ru')).toBe(true)
  })

  it('should reject language codes that are not exactly 2 letters', () => {
    // Too short
    expect(isValidLanguageCodeFormat('e')).toBe(false)
    expect(isValidLanguageCodeFormat('a')).toBe(false)
    
    // Too long
    expect(isValidLanguageCodeFormat('eng')).toBe(false)
    expect(isValidLanguageCodeFormat('spa')).toBe(false)
    expect(isValidLanguageCodeFormat('english')).toBe(false)
    
    // Empty
    expect(isValidLanguageCodeFormat('')).toBe(false)
  })

  it('should reject invalid language code values like Auto or auto', () => {
    // These should all be rejected (not 2 letters)
    expect(isValidLanguageCodeFormat('Auto')).toBe(false)
    expect(isValidLanguageCodeFormat('auto')).toBe(false)
    expect(isValidLanguageCodeFormat('AUTO')).toBe(false)
    expect(isValidLanguageCodeFormat('unknown')).toBe(false)
    expect(isValidLanguageCodeFormat('detect')).toBe(false)
    expect(isValidLanguageCodeFormat('undefined')).toBe(false)
    expect(isValidLanguageCodeFormat('null')).toBe(false)
  })

  it('should reject codes with numbers or special characters', () => {
    expect(isValidLanguageCodeFormat('e1')).toBe(false)
    expect(isValidLanguageCodeFormat('1e')).toBe(false)
    expect(isValidLanguageCodeFormat('12')).toBe(false)
    expect(isValidLanguageCodeFormat('123')).toBe(false)
    expect(isValidLanguageCodeFormat('en-US')).toBe(false)
    expect(isValidLanguageCodeFormat('en_US')).toBe(false)
    expect(isValidLanguageCodeFormat('en US')).toBe(false)
    expect(isValidLanguageCodeFormat('e@')).toBe(false)
    expect(isValidLanguageCodeFormat('e#')).toBe(false)
  })

  it('should validate that both source and target languages have valid format', () => {

    // Valid pairs
    expect(validateLanguagePair('en', 'es')).toEqual({ valid: true })
    expect(validateLanguagePair('fr', 'de')).toEqual({ valid: true })
    expect(validateLanguagePair('zh', 'ja')).toEqual({ valid: true })

    // Invalid source
    expect(validateLanguagePair('Auto', 'es')).toEqual({ 
      valid: false, 
      reason: 'Invalid source language code: Auto' 
    })
    expect(validateLanguagePair('eng', 'es')).toEqual({ 
      valid: false, 
      reason: 'Invalid source language code: eng' 
    })

    // Invalid target
    expect(validateLanguagePair('en', 'Auto')).toEqual({ 
      valid: false, 
      reason: 'Invalid target language code: Auto' 
    })
    expect(validateLanguagePair('en', 'spa')).toEqual({ 
      valid: false, 
      reason: 'Invalid target language code: spa' 
    })

    // Both invalid
    expect(validateLanguagePair('Auto', 'Auto')).toEqual({ 
      valid: false, 
      reason: 'Invalid source language code: Auto' 
    })
  })

  it('should not render model status with invalid language codes', () => {

    // Valid language codes - should render
    expect(shouldRenderWithLanguages('en', 'es')).toBe(true)
    expect(shouldRenderWithLanguages('fr', 'de')).toBe(true)

    // Invalid language codes - should NOT render
    expect(shouldRenderWithLanguages('Auto', 'es')).toBe(false)
    expect(shouldRenderWithLanguages('en', 'Auto')).toBe(false)
    expect(shouldRenderWithLanguages('auto', 'es')).toBe(false)
    expect(shouldRenderWithLanguages('eng', 'spa')).toBe(false)
    expect(shouldRenderWithLanguages('', 'es')).toBe(false)
    expect(shouldRenderWithLanguages('en', '')).toBe(false)
    expect(shouldRenderWithLanguages('', '')).toBe(false)
  })
})
