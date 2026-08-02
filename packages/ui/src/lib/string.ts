export function capitalize(str?: string) {
  if (!str) return "";
  if (str.length === 1) return str.toUpperCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export function fromKebabCase(str?: string) {
  if (!str) return "";
  return str.replace(/-/g, " ");
};

export function fromPascalCase(str?: string) {
  if (!str) return "";
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
};

export function fromCamelCase(str?: string) {
  if (!str) return "";
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
};

export function fromSnakeCase(str?: string) {
  if (!str) return "";
  return str.replace(/_/g, " ");
};

export function toKebabCase(str?: string) {
  if (!str) return "";
  return str.toLowerCase().replace(/ /g, "-");
};

export function toPascalCase(str?: string) {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/ /g, "")
    .replace(/^./, (str) => str.toUpperCase());
};

export function toCamelCase(str?: string) {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/ /g, "")
    .replace(/^./, (str) => str.toLowerCase());
};
