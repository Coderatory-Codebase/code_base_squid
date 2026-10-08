export const formatOrganizationDate = (value: string, includeTime = false): string => new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  ...(includeTime ? { timeStyle: "short" } : {}),
  timeZone: "UTC"
}).format(new Date(value));
