type ClassValue = false | null | string | undefined;

export const cn = (...values: ClassValue[]): string => {
  return values.filter(Boolean).join(' ');
};
