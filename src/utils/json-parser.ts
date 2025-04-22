/**
 * Utility functions for parsing JSON from AI responses
 */

/**
 * Extracts JSON from a string that might contain markdown code blocks or other text
 * @param text The text that might contain JSON
 * @returns The extracted JSON string or null if no JSON is found
 */
export function extractJsonFromText(text: string): string | null {
  // First, try to find JSON in markdown code blocks (most common pattern from LLMs)
  const markdownJsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
  const markdownMatch = text.match(markdownJsonRegex);

  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // Next, look for any text that starts with a { and ends with a } with balanced braces
  // This is a more robust approach to find JSON objects in text
  let braceCount = 0;
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        // We found a complete JSON object
        return text.substring(startIndex, i + 1).trim();
      }
    }
  }

  // If we couldn't find a balanced JSON object, fall back to a simple regex
  const jsonObjectRegex = /(\{[\s\S]*?\})/;
  const objectMatch = text.match(jsonObjectRegex);

  if (objectMatch && objectMatch[1]) {
    return objectMatch[1].trim();
  }

  return null;
}

/**
 * Safely parses JSON from a string that might contain markdown or other text
 * @param text The text that might contain JSON
 * @returns The parsed JSON object or null if parsing fails
 */
export function safeJsonParse(text: string): any | null {
  // Handle empty or non-string input
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Clean the text - remove any non-printable characters that might break JSON parsing
  const cleanedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  try {
    // First try direct parsing
    return JSON.parse(cleanedText);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from the text
    const extractedJson = extractJsonFromText(cleanedText);

    if (extractedJson) {
      try {
        return JSON.parse(extractedJson);
      } catch (innerError) {
        console.warn('Failed to parse extracted JSON, attempting manual fixes');

        // Try to fix common JSON issues
        try {
          // Fix unquoted property names
          const fixedJson = extractedJson
            .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Add quotes to property names
            .replace(/:\s*'([^']*)'/g, ':"$1"'); // Replace single quotes with double quotes

          return JSON.parse(fixedJson);
        } catch (fixError) {
          console.warn('Failed to parse JSON after fixes:', fixError);
          return null;
        }
      }
    }

    // Last resort: try to construct a simple object from key-value patterns
    try {
      const result: Record<string, any> = {};

      // Look for patterns like "key: value" or "key = value"
      const keyValuePattern = /["']?([\w\s]+)["']?\s*[:=]\s*["']?([\w\s.\-]+)["']?/g;
      let match;

      while ((match = keyValuePattern.exec(cleanedText)) !== null) {
        const [, key, value] = match;
        if (key && value) {
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();

          // Try to convert value to appropriate type
          if (!isNaN(Number(trimmedValue))) {
            result[trimmedKey] = Number(trimmedValue);
          } else if (trimmedValue.toLowerCase() === 'true') {
            result[trimmedKey] = true;
          } else if (trimmedValue.toLowerCase() === 'false') {
            result[trimmedKey] = false;
          } else {
            result[trimmedKey] = trimmedValue;
          }
        }
      }

      // Only return if we found at least one key-value pair
      return Object.keys(result).length > 0 ? result : null;
    } catch (e) {
      return null;
    }
  }
}
