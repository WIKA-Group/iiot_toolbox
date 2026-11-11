import type { DecodeHexUplinkFailureOutput, DecodeHexUplinkInput } from '@w2a-iiot/parsers'
import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'

type Range = { start: number, end: number }

type ParserFactory = () => {
  decodeHexUplink: (...args: never[]) => unknown
  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (channel: never, range: Range) => void
}

type ParserModule = typeof import('@w2a-iiot/parsers')

type ParserFactoryName = {
  [Key in keyof ParserModule]: ParserModule[Key] extends ParserFactory ? Key : never
}[keyof ParserModule]

type ChannelsOf<F extends ParserFactory> = Parameters<ReturnType<F>['adjustMeasuringRange']>[0]

type MissingChannels<F extends ParserFactory, TListed extends string> = Exclude<ChannelsOf<F>, TListed>

type ExhaustiveChannels<F extends ParserFactory, TListed extends string>
  = [MissingChannels<F, TListed>] extends [never]
    ? { _exhaustive?: never }
    : { _exhaustive: ['registry is missing adjustable channels:', MissingChannels<F, TListed>] }

export interface DeviceParserInstance {
  decodeHexUplink: (input: DecodeHexUplinkInput) => { data: object, warnings?: string[] } | DecodeHexUplinkFailureOutput
  adjustRoundingDecimals: (decimals: number) => void
  adjustMeasuringRange: (channel: string, range: Range) => void

  encodeMultipleDownlinks?: (...args: never[]) => unknown
  encodeDownlink?: (...args: never[]) => unknown
}

export type Protocol = 'TULIP2' | 'TULIP3'

export interface DeviceEntry {

  slug: string
  parserExport: ParserFactoryName

  rawDir: string

  img: string

  label: string

  description: string

  tags: string[]

  channels: readonly string[]

  decodes: readonly Protocol[]

  encodes: readonly Protocol[]

  tulip2ConfigurationForm?: Component

  tulip2ChannelLabels?: Readonly<Record<string, string>>

  // Keyed by TULIP3 channel path, e.g. 'sensor1.channel1'.
  tulip3ChannelLabels?: Readonly<Record<string, string>>

  // Display names for the adjustable measuring-range channels, keyed by the parser's channel name.
  measuringRangeLabels?: Readonly<Record<string, string>>
}

function defineDevice<
  const TFactoryName extends ParserFactoryName,
  const TChannels extends readonly ChannelsOf<ParserModule[TFactoryName]>[],
>(
  entry: Omit<DeviceEntry, 'parserExport' | 'channels'>
    & { parserExport: TFactoryName, channels: TChannels }
    & ExhaustiveChannels<ParserModule[TFactoryName], TChannels[number]>,
): DeviceEntry {
  return entry
}

export const devices = {

  'a2g': defineDevice({
    slug: 'a2g',
    parserExport: 'A2GParser',
    rawDir: 'A2G',
    img: '/A2G.png',
    label: 'A2G',
    description: 'Decode data from A2G differential pressure monitors',
    tags: ['A2G', 'differential pressure', 'LoRa'],

    channels: [],
    decodes: ['TULIP2'],
    encodes: [],
  }),
  'flru': defineDevice({
    slug: 'flru',
    parserExport: 'FLRUParser',
    rawDir: 'FLRU_NETRIS3',
    img: '/FLRU_Netris3.png',
    label: 'FLRU+NETRIS3',
    description: 'Decode data from FLRU devices with a NETRIS3 radio unit',
    tags: ['FLRU', 'NETRIS3', 'level', 'LoRa'],
    channels: ['level'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Distance',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Distance',
    },
    measuringRangeLabels: {
      level: 'Distance',
    },
  }),
  'gd20w': defineDevice({
    slug: 'gd20w',
    parserExport: 'GD20WParser',
    rawDir: 'GD20W',
    img: '/GD20W.png',
    label: 'GD-20-W',
    description: 'Decode data from and encode data to GD-20-W gas density monitors',
    tags: ['GD20W', 'GD-20-W', 'gas density', 'LoRa'],
    channels: ['channel0', 'channel1', 'channel2', 'channel3', 'channel4', 'channel5'],
    decodes: ['TULIP2'],
    encodes: ['TULIP2'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Channel 1',
      channel1: 'Channel 2',
      channel2: 'Channel 3',
      channel3: 'Channel 4',
      channel4: 'Channel 5',
      channel5: 'Channel 6',
    },
    measuringRangeLabels: {
      channel0: 'Channel 1',
      channel1: 'Channel 2',
      channel2: 'Channel 3',
      channel3: 'Channel 4',
      channel4: 'Channel 5',
      channel5: 'Channel 6',
    },
  }),
  'netris1': defineDevice({
    slug: 'netris1',
    parserExport: 'NETRIS1Parser',
    rawDir: 'NETRIS1',
    img: '/Netris1.png',
    label: 'NETRIS1',
    description: 'Decode data from NETRIS1 devices',
    tags: ['NETRIS1', 'temperature', 'current', 'voltage', 'relative', 'resistance', 'potentiometer', 'LoRa'],
    channels: ['measurement'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Channel 1',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Channel 1',
    },
    measuringRangeLabels: {
      measurement: 'Channel 1',
    },
  }),
  'netris2': defineDevice({
    slug: 'netris2',
    parserExport: 'NETRIS2Parser',
    rawDir: 'NETRIS2',
    img: '/NETRIS2.png',
    label: 'NETRIS2',
    description: 'Decode data from and encode data to NETRIS2 devices',

    tags: ['NETRIS2', 'current', 'LoRa'],

    channels: [],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Electrical current 1',
      channel1: 'Electrical current 2',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Electrical current 1',
      'sensor2.channel1': 'Electrical current 2',
    },
  }),
  'netris-f': defineDevice({
    slug: 'netris-f',
    parserExport: 'NETRISFParser',
    rawDir: 'NETRISF',

    img: '/F98W6.png',
    label: 'NETRIS_F (prev. F98W6)',
    description: 'Decode data from and encode data to NETRIS_F devices, formerly known as F98W6',

    tags: ['NETRIS_F', 'F98W6', 'force', 'mass', 'strain', 'LoRa'],
    channels: ['measurement'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Channel 1',
      channel1: 'Device temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Channel 1',
      'sensor1.channel2': 'Device temperature',
    },
    measuringRangeLabels: {
      measurement: 'Channel 1',
    },
  }),
  'peu': defineDevice({
    slug: 'peu',
    parserExport: 'PEUParser',
    rawDir: 'PEU_NETRIS3',
    img: '/PEU_Netris3.png',
    label: 'PEU+NETRIS3',
    description: 'Decode data from and encode data to PEU pressure sensors with a NETRIS3 radio unit',
    tags: ['PEU', 'PEU-20', 'PEU-21', 'NETRIS3', 'pressure', 'LoRa'],
    channels: ['pressure'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Pressure',
      channel1: 'Device temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Pressure',
      'sensor1.channel2': 'Device temperature',
    },
  }),
  'pew': defineDevice({
    slug: 'pew',
    parserExport: 'PEWParser',
    rawDir: 'PEW',
    img: '/PEW.png',
    label: 'PEW-1000',
    description: 'Decode data from and encode data to PEW-1000 pressure sensors',
    tags: ['PEW', 'PEW-1000', 'pressure', 'LoRa'],
    channels: ['pressure'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Pressure',
      channel1: 'Device temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Pressure',
      'sensor1.channel2': 'Device temperature',
    },
  }),
  'pgu': defineDevice({
    slug: 'pgu',
    parserExport: 'PGUParser',
    rawDir: 'PGU_NETRIS3',
    img: '/PGU_Netris3.png',
    label: 'PGU+NETRIS3',
    description: 'Decode data from and encode data to PGU pressure gauges with a NETRIS3 radio unit',
    tags: ['PGU', 'PGU23.100', 'PGU26.100', 'NETRIS3', 'pressure', 'LoRa'],
    channels: ['pressure'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Pressure',
      channel1: 'Device temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Pressure',
      'sensor1.channel2': 'Device temperature',
    },
  }),
  'pgw23': defineDevice({
    slug: 'pgw23',
    parserExport: 'PGW23Parser',
    rawDir: 'PGW23_100_11',

    img: '/PGW.png',
    label: 'PGW23.100.11',
    description: 'Decode data from and encode data to PGW23 pressure gauges',
    tags: ['PGW23', 'pressure', 'LoRa'],
    channels: ['pressure'],
    decodes: ['TULIP2'],
    encodes: ['TULIP2'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Pressure',
      channel1: 'Device temperature',
    },
  }),
  'tgu': defineDevice({
    slug: 'tgu',
    parserExport: 'TGUParser',
    rawDir: 'TGU_NETRIS3',
    img: '/TGU_Netris3.png',
    label: 'TGU+NETRIS3',
    description: 'Decode data from and encode data to TGU thermometers with a NETRIS3 radio unit',
    tags: ['TGU', 'TGU73.100', 'NETRIS3', 'temperature', 'LoRa'],
    channels: ['temperature'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Temperature',
      channel1: 'Device temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Temperature',
      'sensor1.channel2': 'Device temperature',
    },
  }),
  'tru': defineDevice({
    slug: 'tru',
    parserExport: 'TRUParser',
    rawDir: 'TRU_NETRIS3',
    img: '/TRU_Netris3.png',
    label: 'TRU+NETRIS3',
    description: 'Decode data from and encode data to TRU temperature sensors with a NETRIS3 radio unit',
    tags: ['TRU', 'NETRIS3', 'temperature', 'LoRa'],
    channels: ['temperature'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Temperature',
    },
  }),
  'trw': defineDevice({
    slug: 'trw',
    parserExport: 'TRWParser',
    rawDir: 'TRW',
    img: '/TRW.png',
    label: 'TRW',
    description: 'Decode data from and encode data to TRW temperature sensors',
    tags: ['TRW', 'temperature', 'LoRa'],
    channels: ['temperature'],
    decodes: ['TULIP2', 'TULIP3'],

    encodes: ['TULIP2', 'TULIP3'],
    tulip2ConfigurationForm: defineAsyncComponent(() => import('~/components/encoders/Tulip2MainConfiguration.vue')),
    tulip2ChannelLabels: {
      channel0: 'Temperature',
    },
    tulip3ChannelLabels: {
      'sensor1.channel1': 'Temperature',
    },
  }),
} satisfies Record<string, DeviceEntry>

export type DeviceSlug = keyof typeof devices

export const deviceList: DeviceEntry[] = Object.values(devices)

export function getDevice(slug: string): DeviceEntry | null {
  return Object.hasOwn(devices, slug) ? devices[slug as DeviceSlug] : null
}

export async function loadDeviceParserFactory(device: DeviceEntry): Promise<() => DeviceParserInstance> {
  const parserModule = await import('@w2a-iiot/parsers')
  return parserModule[device.parserExport] as unknown as () => DeviceParserInstance
}

const MEASURAND_TAGS = new Set([
  'differential pressure',
  'pressure',
  'temperature',
  'level',
  'current',
  'voltage',
  'resistance',
  'force',
  'mass',
  'strain',
  'gas density',
])

export function measurandOf(device: DeviceEntry): string | undefined {
  const terms = device.tags.filter(tag => MEASURAND_TAGS.has(tag.toLowerCase()))
  if (terms.length === 0) return undefined
  const joined = terms.length === 1
    ? terms[0]!
    : `${terms.slice(0, -1).join(', ')} or ${terms[terms.length - 1]}`
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}

export function channelQueryKey(channel: string, bound: 'Start' | 'End'): string {
  return `${channel.replace(/\W+/g, '_')}${bound}`
}
