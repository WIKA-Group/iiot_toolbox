// Types 0x00-0x0F belong to TULIP2 (legacy), 0x10 and above to TULIP3.
const TULIP2_TYPES: Record<number, string> = {
  0x01: 'Data message',
  0x02: 'Data message (alarm ongoing)',
  0x03: 'Process alarm',
  0x04: 'Technical alarm',
  0x05: 'Device alarm',
  0x06: 'Configuration status',
  0x07: 'Device identification',
  0x08: 'Keep alive',
  0x09: 'Extended device identification',
  0x0A: 'Channel technical alarm',
  0x0B: 'Main configuration',
  0x0C: 'Process alarm configuration',
  0x0D: 'Channel property configuration',
}

const TULIP3_TYPES: Record<number, { name: string, sub: Record<number, string> }> = {
  0x10: { name: 'Data message', sub: { 1: 'Data message' } },
  0x11: { name: 'Data message (alarm ongoing)', sub: { 1: 'Data message' } },
  0x12: { name: 'Process alarms', sub: { 1: 'Process alarm message' } },
  0x13: { name: 'Device alarms', sub: { 1: 'Communication module alarm message', 2: 'Sensor alarm message', 3: 'Channel alarm message' } },
  0x14: { name: 'Identification', sub: { 1: 'Identity fields message', 2: 'Read fields response message', 3: 'Write fields response message', 4: 'Update fields message' } },
  0x15: { name: 'Configuration', sub: { 1: 'Update fields message', 2: 'Read fields response message', 3: 'Write fields response message' } },
  0x16: { name: 'Periodic event', sub: { 1: 'Keep alive message' } },
  0x17: { name: 'Spontaneous event', sub: { 1: 'Generic downlink answer message', 2: 'Fetch additional downlink message' } },
}

export function messageTypeName(type: number): string | undefined {
  return type < 0x10 ? TULIP2_TYPES[type] : TULIP3_TYPES[type]?.name
}

export function messageSubTypeName(type: number, subType: number): string | undefined {
  return TULIP3_TYPES[type]?.sub[subType]
}

export function formatHexCode(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(2, '0')}`
}
