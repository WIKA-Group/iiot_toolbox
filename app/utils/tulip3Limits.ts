import type { DeviceProfile, RegisterInfo } from '~/utils/tulip3Registers'

interface Range { min: number, max: number }

// CSV names differ: its MeasuringRate is the measuring period, PublicationFactor the transmission rate,
// and its TransmissionRate the resulting interval (period × rate) in seconds.
export interface CommunicationLimits {
  measuringPeriod: Range
  transmissionRate: Range
  interval: Range
}

const LEGACY: CommunicationLimits = {
  measuringPeriod: { min: 2, max: 604800 },
  transmissionRate: { min: 1, max: 65535 },
  interval: { min: 60, max: 604800 },
}

const NETRIS: CommunicationLimits = {
  measuringPeriod: { min: 60, max: 86400 },
  transmissionRate: { min: 1, max: 2880 },
  interval: { min: 60, max: 172800 },
}

const COMMUNICATION_LIMITS: Readonly<Record<string, CommunicationLimits>> = {
  'pew': LEGACY,
  'netris-f': LEGACY,
  'netris1': LEGACY,
  'trw': LEGACY,
  'netris2': NETRIS,
  'peu': NETRIS,
  'pgu': NETRIS,
  'tru': NETRIS,
  'flru': NETRIS,
  'tgu': NETRIS,
}

const REGISTER_LIMITS: Readonly<Record<string, Readonly<Record<string, Range>>>> = {
  netris2: {
    downlinkAnswerTimeout: { min: 10, max: 60 },
    fetchAdditionalDownlinkTimeInterval: { min: 10, max: 60 },
    bootTime: { min: 100, max: 15000 },
    communicationTimeout: { min: 10, max: 100 },
    communicationRetryCount: { min: 1, max: 5 },
  },
}

const LIMIT_OF: Readonly<Record<string, 'measuringPeriod' | 'transmissionRate'>> = {
  measuringPeriodAlarmOff: 'measuringPeriod',
  measuringPeriodAlarmOn: 'measuringPeriod',
  transmissionRateAlarmOff: 'transmissionRate',
  transmissionRateAlarmOn: 'transmissionRate',
}

export const communicationLimits = (slug: string | undefined): CommunicationLimits | undefined =>
  slug ? COMMUNICATION_LIMITS[slug] : undefined

// Intersect with what the parser accepts, so a CSV bound the parser rejects is never offered.
function narrow(register: RegisterInfo, range: Range | undefined): RegisterInfo {
  const { facts } = register
  if (!range || facts.access !== 'readWrite' || (facts.control !== 'number' && facts.control !== 'integer')) return register

  return {
    ...register,
    facts: {
      ...facts,
      min: Math.max(range.min, facts.min ?? range.min),
      max: Math.min(range.max, facts.max ?? range.max),
    },
  }
}

export function withCommunicationLimits(profile: DeviceProfile, slug: string | undefined): DeviceProfile {
  const limits = communicationLimits(slug)
  const own = slug ? REGISTER_LIMITS[slug] : undefined
  if (!limits && !own) return profile

  const rangeOf = (path: string, name: string): Range | undefined => {
    const kind = LIMIT_OF[name]
    if (path === 'communicationModule.configuration' && limits && kind) return limits[kind]
    return own?.[name]
  }

  return {
    ...profile,
    groups: profile.groups.map(group => ({
      ...group,
      registers: group.registers.map(register => narrow(register, rangeOf(group.path, register.name))),
    })),
  }
}
