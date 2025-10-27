export function isKeyOf<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return Object.hasOwn(obj, key);
}
