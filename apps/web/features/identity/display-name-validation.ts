export const getDisplayNameValidationMessage = (value: string): string | null => {
  const name = value.trim();
  if (name.length === 0) return "Enter a display name.";
  if (name.length > 80) return "Use 80 characters or fewer.";
  return null;
};
