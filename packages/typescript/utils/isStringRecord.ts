function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return Object.values(value).every((v) => typeof v === 'string');
}

export function assertIsStringRecord(value: any): asserts value is Record<string, string> {
  if (!isStringRecord(value)) {
    throw new Error('Value is not a valid string record');
  }
}
