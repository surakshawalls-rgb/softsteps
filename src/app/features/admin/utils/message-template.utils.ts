export type PlaceholderValues = Record<string, string | null | undefined>;

export function normalizeText(value: string | null | undefined, fallback = ''): string {
  const normalized = value?.trim();

  return normalized ? normalized : fallback;
}

export function replacePlaceholders(template: string, values: PlaceholderValues): string {
  return template.replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, (_, key: string) => {
    const value = values[key];
    const normalized = normalizeText(value);

    return normalized || '';
  });
}

export function getGreetingName(inputName: string | null | undefined): string {
  const name = normalizeText(inputName);

  return name || 'there';
}

export function getMessagePreviewValue(value: string | null | undefined): string {
  return normalizeText(value, 'Not provided');
}
