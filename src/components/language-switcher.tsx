'use client'

import { useState } from 'react'
import { useTranslation } from '@/contexts/translation-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe, Check } from 'lucide-react'

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  const [isChanging, setIsChanging] = useState(false)

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ]

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return

    setIsChanging(true)

    try {
      setLocale(newLocale)
      // Reload to apply all translations
      window.location.reload()
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const currentLanguage =
    languages.find((lang) => lang.code === locale) || languages[0]

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <Select
        value={locale}
        onValueChange={handleLanguageChange}
        disabled={isChanging}
      >
        <SelectTrigger className="h-8 w-32">
          <SelectValue>
            <div className="flex items-center space-x-2">
              <span>{currentLanguage.flag}</span>
              <span className="text-sm">{currentLanguage.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center space-x-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {language.code === locale && (
                  <Check className="h-3 w-3 text-green-600" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
