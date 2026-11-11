import type { RegisterInfo } from '~/utils/tulip3Registers'
import { PROCESS_ALARM_FLAGS } from '~/utils/tulip3Registers'

// The device stores these registers as one bitmask, so every entry needs an explicit on/off choice.
export function setMembers(register: RegisterInfo): readonly string[] {
  const { facts } = register
  if (facts.access !== 'readWrite') return []
  if (facts.control === 'flags') return PROCESS_ALARM_FLAGS
  if (facts.control === 'channelSet') return facts.keys
  return []
}

export function parseSet(raw: string): Map<string, boolean> {
  const decided = new Map<string, boolean>()
  for (const entry of raw.split(',')) {
    const [member, state] = entry.split('=')
    if (member && (state === 'on' || state === 'off')) decided.set(member, state === 'on')
  }
  return decided
}

export function serializeSet(decided: Map<string, boolean>, members: readonly string[]): string {
  return members
    .filter(member => decided.has(member))
    .map(member => `${member}=${decided.get(member) ? 'on' : 'off'}`)
    .join(',')
}

// Nothing decided yet is fine (the register is not written); a partly decided set is incomplete.
export function undecidedMembers(raw: string, members: readonly string[]): string[] {
  const decided = parseSet(raw)
  if (decided.size === 0) return []
  return members.filter(member => !decided.has(member))
}
