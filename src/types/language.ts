// Define language types for the application

export type SupportedLanguage = 
  | 'en'  // English
  | 'fr'  // French
  | 'es'  // Spanish
  | 'de'  // German
  | 'it'  // Italian
  | 'pt'  // Portuguese
  | 'zh'  // Chinese
  | 'ja'  // Japanese
  | 'ko'  // Korean
  | 'ar'  // Arabic
  | 'ru'; // Russian

export const SUPPORTED_LANGUAGES: { id: SupportedLanguage; name: string }[] = [
  { id: "en", name: "English" },
  { id: "fr", name: "French" },
  { id: "es", name: "Spanish" },
  { id: "de", name: "German" },
  { id: "it", name: "Italian" },
  { id: "pt", name: "Portuguese" },
  { id: "zh", name: "Chinese" },
  { id: "ja", name: "Japanese" },
  { id: "ko", name: "Korean" },
  { id: "ar", name: "Arabic" },
  { id: "ru", name: "Russian" }
];

// Helper function to get language name from code
export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.id === code);
  return language ? language.name : code;
}
