export interface ExampleUplink {
  description: string
  hex: string
}

export const EXAMPLE_UPLINKS: Readonly<Record<string, readonly ExampleUplink[]>> = {
  'a2g': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels',
      hex: '010042DC6666442286660000000000000000000000000000000001',
    },
    {
      description: 'TULIP2: technical message: 04 data message',
      hex: '04000F',
    },
    {
      description: 'TULIP2: radio unit message: 05 data message',
      hex: '050D0102',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07660D0012030A8237313030455758360000000000000000C51C4000451C4000010B0214282E',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '0821C9',
    },
    {
      description: 'TULIP2: data message: 01 data message only 1 measurement channel (only pressure for longer battery life)',
      hex: '0101BE5CF94C',
    },
    {
      description: 'TULIP2: Radio unit identification message low power version: metrology information message',
      hex: '07010D0012030500325930303030314847485A0000000000C51C4000451C400001',
    },
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels (small value)',
      hex: '0100C2DDCCCDC29200000000000000000000000000000000000003',
    },
  ],
  'flru': [
    {
      description: 'TULIP2: data message: 01 data message with 1 active measurement channels',
      hex: '0100002E97',
    },
    {
      description: 'TULIP2: data message: 02 data message with 1 active measurement channels',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: process alarm message: alert message low threshold',
      hex: '031100000D73',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '040000040001',
    },
    {
      description: 'TULIP2: radio unit message: Battery is low and RF duty-cycle limit was exceeded',
      hex: '050D0005',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07110F0000140A00000000447A00003C',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '081F00C781A1006CA4F8',
    },
    {
      description: 'TULIP2: Extended identification message: extended radio unit & instrument identification',
      hex: '090A0F526565644D75737465722D3100BC614E00030001000000040200353E4E4E364555535832030106',
    },
    {
      description: 'TULIP3: data message: data message with compact encoding for 1 channel',
      hex: '1001062E97',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 1st channel appears',
      hex: '12010080',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 sensor 1 (distance)',
      hex: '1303000010',
    },
    {
      description: 'TULIP3: keep alive message: Battery powered, 2 configs have been made and battery at 100%',
      hex: '160160000264',
    },
    {
      description: 'TULIP3: identification message: Read identification response with serial number',
      hex: '140201AB3141303132334142433435',
    },
    {
      description: 'TULIP3: identification message: Write identification response - success',
      hex: '14030001000300',
    },
  ],
  'gd20w': [
    {
      description: 'TULIP2: uplink - data message with channels 1,2 and 5 and no ongoing alarm',
      hex: '0104001254012135041754',
    },
    {
      description: 'TULIP2: uplink- process alarm message for channel 0 with high threshold alarm',
      hex: '0307000009BF',
    },
    {
      description: 'TULIP2: uplink - sensor technical alarm message for channel 0 with alarmtype 0400',
      hex: '0405000400',
    },
    {
      description: 'TULIP2: uplink - Device alarm message with battery low alarm triggered',
      hex: '05020001',
    },
    {
      description: 'TULIP2: uplink - Configuration status message with main configuration',
      hex: '060120040000003C00050000003C000100',
    },
    {
      description: 'TULIP2: uplink - Device identification message',
      hex: '070015400200010050484F454E49585F4642000407030A0101176E040C03076400000000000000',
    },
    {
      description: 'TULIP2: uplink - Keep alive message with restart event and 99% battery estimation',
      hex: '080063',
    },
    {
      description: 'TULIP2: uplink - Extended device identification message with measuring ranges',
      hex: '090000000000414000000000000048435000C220000042A0000000000000412000000000000043480000BF8000003F800000',
    },
  ],
  'netris1': [
    {
      description: 'TULIP2: data message: 01 data message (voltage)',
      hex: '0100000CB3',
    },
    {
      description: 'TULIP2: data message: 02 data message (voltage)',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: data message: Process Alarm Message (voltage/low threshold)',
      hex: '031100010D73',
    },
    {
      description: 'TULIP2: data message: Technical Alarm Message',
      hex: '0401000081',
    },
    {
      description: 'TULIP2: data message: Device Alarm Message',
      hex: '05000001',
    },
    {
      description: 'TULIP2: data message: Keep-Alive Alarm Message',
      hex: '08003F',
    },
    {
      description: 'TULIP2: data message: Measurement Input Failure Alarm Message',
      hex: '0A00000004',
    },
    {
      description: 'TULIP2: data message: Device Identification Message',
      hex: '0700104002000100314132423343344435453600000000412000000E58',
    },
    {
      description: 'TULIP3: data message: normal data message with compact encoding',
      hex: '1001062E97',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel',
      hex: '12010480',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 sensor 1 and maximum physical limit for channel 2 sensor 1 (device temperature)',
      hex: '1303000010',
    },
    {
      description: 'TULIP3: identification message: partial registers',
      hex: '140100041E02010107C1010F020101',
    },
    {
      description: 'TULIP3: identification message: register update message',
      hex: '14040F2102',
    },
    {
      description: 'TULIP3: identification message: Contains Serial number',
      hex: '140201AB3141303132334142433435',
    },
  ],
  'netris2': [
    {
      description: 'TULIP2: data message: 1 data message and no ongoing alarm',
      hex: '011F011807',
    },
    {
      description: 'TULIP2: data message: 2 data messages and at least one ongoing alarm',
      hex: '02000308D31F90',
    },
    {
      description: 'TULIP2: process alarm message: alarm message low threshold',
      hex: '031100000D73',
    },
    {
      description: 'TULIP2: technical alarm message: short condition on channel 0 and open condition on channel 1',
      hex: '0400030201',
    },
    {
      description: 'TULIP2: configuration status message: configuration status message',
      hex: '060120',
    },
    {
      description: 'TULIP2: radio unit identification message: radio unit identification message',
      hex: '07000E000106000110000001314131333755395430364B00',
    },
    {
      description: 'TULIP2: keep alive message: keep alive message',
      hex: '080C0000001300000020631A',
    },
    {
      description: 'TULIP2: data message: 1 data message and no ongoing alarm',
      hex: '0114011807',
    },
    {
      description: 'TULIP3: data message: compact encoding for sensor1/channel1 and sensor2/channel1',
      hex: '1001062E9746152F',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm on sensor2/channel1',
      hex: '12014080',
    },
    {
      description: 'TULIP3: device alarm message: communication module alarms - low and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: sensor alarms - communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: channel alarms - min physical on sensor1/channel1 and max physical on sensor2/channel1',
      hex: '1303000010400020',
    },
    {
      description: 'TULIP3: keep alive message: battery powered, revision counter 2, battery 100%',
      hex: '160160000264',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm disappears on sensor2/channel1',
      hex: '12014000',
    },
  ],
  'netris-f': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels',
      hex: '0141261C301A88',
    },
    {
      description: 'TULIP2: data message: 02 data message with 2 active measurement channels',
      hex: '02002309B91AF0',
    },
    {
      description: 'TULIP2: process alarm message: alert message low threshold',
      hex: '03000119B4',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '040001',
    },
    {
      description: 'TULIP2: radio unit message: Battery is low',
      hex: '0500001C',
    },
    {
      description: 'TULIP2: configuration status message: configuration successful',
      hex: '060F20',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07410B0002000100323230313038303234370002C39C4000439C4000C234000042DC0000B920',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '08003F',
    },
    {
      description: 'TULIP3: data message: normal data message with compact encoding',
      hex: '1001062E970E152F',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel',
      hex: '12010880',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 sensor 1 (strain) and maximum physical limit for channel 2 sensor 1 (device temperature)',
      hex: '1303000010080020',
    },
    {
      description: 'TULIP3: identification message: partial registers',
      hex: '140100041E02010107C1030F021DB915420101',
    },
    {
      description: 'TULIP3: identification message: register update message',
      hex: '14040F021DB9',
    },
    {
      description: 'TULIP3: identification message: Contains Serial number',
      hex: '140201AB3141303132334142433435',
    },
  ],
  'peu': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels',
      hex: '0100002E971253',
    },
    {
      description: 'TULIP2: data message: 02 data message with 1 active measurement channels',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: process alarm message: alert message low threshold',
      hex: '031100000D73',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '040000040001',
    },
    {
      description: 'TULIP2: radio unit message: Battery is low and RF duty-cycle limit was exceeded',
      hex: '050D0005',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07110F0000150300000000412000000701C22000004270000001',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '081F00C781A1006CA4F8',
    },
    {
      description: 'TULIP2: Extended identification message: extended radio unit & instrument identification',
      hex: '090A0F50484F454E49585F464E424E00BC614E00000000000100000800353E4E4E364555535832030106',
    },
    {
      description: 'TULIP3: data message: data message with compact encoding for 2 channels',
      hex: '1001062E970E152F',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel appears',
      hex: '12010880',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 (pressure) and maximum physical limit for channel 2 (device temperature)',
      hex: '1303000010080020',
    },
    {
      description: 'TULIP3: keep alive message: Battery powered, 2 configs have been made and battery at 100%',
      hex: '160160000264',
    },
    {
      description: 'TULIP3: identification message: Read identification response with serial number',
      hex: '140201AB3141303132334142433435',
    },
    {
      description: 'TULIP3: identification message: Write identification response - success',
      hex: '14030001000300',
    },
  ],
  'pew': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels and battery voltage',
      hex: '01002309B91AF0',
    },
    {
      description: 'TULIP2: data message: 02 data message with 2 active measurement channels with alarm present',
      hex: '02002309B91AF0',
    },
    {
      description: 'TULIP2: process alarm message: alert message rising threshold',
      hex: '03000119B4',
    },
    {
      description: 'TULIP2: technical message: sensor communication error triggered',
      hex: '040010',
    },
    {
      description: 'TULIP2: device alarm message: low battery',
      hex: '0500001C',
    },
    {
      description: 'TULIP2: configuration status message: configuration successful',
      hex: '060120',
    },
    {
      description: 'TULIP2: mioty main configuration message',
      hex: '0B0300000E1000020000012C00010000',
    },
    {
      description: 'TULIP2: mioty process alarm configuration message for pressure',
      hex: '0C03000064801388',
    },
    {
      description: 'TULIP3: data message: normal data message with compact encoding',
      hex: '1001062E970E152F',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel',
      hex: '12010880',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 sensor 1 (pressure) and maximum physical limit for channel 2 sensor 1 (device temperature)',
      hex: '1303000010080020',
    },
    {
      description: 'TULIP3: identification message: partial registers',
      hex: '140100041E02010107C1030F02030715420101',
    },
    {
      description: 'TULIP3: identification message: register update message',
      hex: '14040F2107',
    },
    {
      description: 'TULIP3: identification message: Contains Serial number',
      hex: '140201AB3141303132334142433435',
    },
  ],
  'pgu': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels',
      hex: '0100002E971253',
    },
    {
      description: 'TULIP2: data message: 02 data message with 1 active measurement channels',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: process alarm message: alert message low threshold',
      hex: '031100000D73',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '040000040001',
    },
    {
      description: 'TULIP2: radio unit message: Battery is low and RF duty-cycle limit was exceeded',
      hex: '050D0005',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07110F0000150300000000412000000701C22000004270000001',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '081F00C781A1006CA4F8',
    },
    {
      description: 'TULIP2: Extended identification message: extended radio unit & instrument identification',
      hex: '090A0F50484F454E49585F464E424E00BC614E00000000000100000800353E4E4E364555535832030106',
    },
    {
      description: 'TULIP3: data message: data message with compact encoding for 2 channels',
      hex: '1001062E970E152F',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel appears',
      hex: '12010880',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 (pressure) and maximum physical limit for channel 2 (device temperature)',
      hex: '1303000010080020',
    },
    {
      description: 'TULIP3: keep alive message: Battery powered, 2 configs have been made and battery at 100%',
      hex: '160160000264',
    },
    {
      description: 'TULIP3: identification message: Read identification response with serial number',
      hex: '140201AB3141303132334142433435',
    },
    {
      description: 'TULIP3: identification message: Write identification response - success',
      hex: '14030001000300',
    },
  ],
  'pgw23': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels and battery voltage',
      hex: '01002309B9226E',
    },
    {
      description: 'TULIP2: data message: 02 data message with 2 active measurement channels with alarm present',
      hex: '02002309B9226E',
    },
    {
      description: 'TULIP2: process alarm message: alert message rising threshold',
      hex: '03000119B4',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '04000119B40932C8',
    },
    {
      description: 'TULIP2: device alarm message: low temperature',
      hex: '050040EC',
    },
    {
      description: 'TULIP2: device identification message: metrology information message',
      hex: '07000A020001000500010050484F454E49585F464200020000000000002041000020C2000070420720',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '08003F',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error disappearance',
      hex: '04008019B488226E',
    },
  ],
  'tgu': [
    {
      description: 'TULIP2: data message: 01 data message with 2 active measurement channels',
      hex: '0100002E971253',
    },
    {
      description: 'TULIP2: data message: 02 data message with 1 active measurement channels',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: process alarm message: alert message low threshold',
      hex: '031100000D73',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '040000040001',
    },
    {
      description: 'TULIP2: radio unit message: Battery is low and RF duty-cycle limit was exceeded',
      hex: '050D0005',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07110F00001601C1A00000430C00000101C22000004270000001',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '081F00C781A1006CA4F8',
    },
    {
      description: 'TULIP2: Extended identification message: extended radio unit & instrument identification',
      hex: '090A0F30303041313037373538392000BC614E00000001000000000800353E4E4E364555535832030106',
    },
    {
      description: 'TULIP3: data message: data message with compact encoding for 2 channels',
      hex: '1001062E970E152F',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel appears',
      hex: '12010880',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 (temperature) and maximum physical limit for channel 2 (device temperature)',
      hex: '1303000010080020',
    },
    {
      description: 'TULIP3: keep alive message: Battery powered, 2 configs have been made and battery at 100%',
      hex: '160160000264',
    },
    {
      description: 'TULIP3: identification message: Read identification response with serial number',
      hex: '140201AB3141303132334142433435',
    },
    {
      description: 'TULIP3: identification message: Write identification response - success',
      hex: '14030001000300',
    },
  ],
  'tru': [
    {
      description: 'TULIP2: data message: 01 data message with 1 active measurement channels',
      hex: '0100002E97',
    },
    {
      description: 'TULIP2: data message: 02 data message with 1 active measurement channels',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: process alarm message: alert message low threshold',
      hex: '031100000D73',
    },
    {
      description: 'TULIP2: technical message: alert message general instrument error',
      hex: '040000040001',
    },
    {
      description: 'TULIP2: radio unit message: Battery is low and RF duty-cycle limit was exceeded',
      hex: '050D0005',
    },
    {
      description: 'TULIP2: Radio unit identification message: metrology information message',
      hex: '07110F00001001C1A00000430C000001',
    },
    {
      description: 'TULIP2: keep-alive message: keep alive',
      hex: '081F00C781A1006CA4F8',
    },
    {
      description: 'TULIP2: Extended identification message: extended radio unit & instrument identification',
      hex: '090A0F5254444D75737465722D313000BC614E00030001000000040200353E4E4E364555535832030106',
    },
    {
      description: 'TULIP3: data message: data message with compact encoding for 1 channel',
      hex: '1001062E97',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 1st channel appears',
      hex: '12010080',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 sensor 1 (temperature)',
      hex: '1303000010',
    },
    {
      description: 'TULIP3: keep alive message: Battery powered, 2 configs have been made and battery at 100%',
      hex: '160160000264',
    },
    {
      description: 'TULIP3: identification message: Read identification response with serial number',
      hex: '140201AB3141303132334142433435',
    },
    {
      description: 'TULIP3: identification message: Write identification response - success',
      hex: '14030001000300',
    },
  ],
  'trw': [
    {
      description: 'TULIP2: data message: 01 data message (temperature)',
      hex: '0100000CB3',
    },
    {
      description: 'TULIP2: data message: 02 data message (temperature)',
      hex: '0207001EB0',
    },
    {
      description: 'TULIP2: data message: Process Alarm Message (temperature/low threshold)',
      hex: '031100010D73',
    },
    {
      description: 'TULIP2: data message: Technical Alarm Message',
      hex: '0401000081',
    },
    {
      description: 'TULIP2: data message: Device Alarm Message',
      hex: '05000001',
    },
    {
      description: 'TULIP2: data message: Keep-Alive Alarm Message',
      hex: '08003F',
    },
    {
      description: 'TULIP2: data message: Measurement Input Failure Alarm Message',
      hex: '0900000004',
    },
    {
      description: 'TULIP2: data message: Device Identification Message',
      hex: '0700104202000100314132423343344435453600000000412000000101',
    },
    {
      description: 'TULIP3: data message: normal data message with compact encoding',
      hex: '1001062E97',
    },
    {
      description: 'TULIP3: process alarm message: low threshold alarm of 2nd channel',
      hex: '12010480',
    },
    {
      description: 'TULIP3: device alarm message: Communication module alarms - low voltage and air time limitation',
      hex: '13010028',
    },
    {
      description: 'TULIP3: device alarm message: Sensor module alarms - sensor communication error',
      hex: '1302000001',
    },
    {
      description: 'TULIP3: device alarm message: Channel alarms - minimum physical limit for channel 1 sensor 1 (pressure) and maximum physical limit for channel 2 sensor 1 (device temperature)',
      hex: '1303000010',
    },
    {
      description: 'TULIP3: identification message: partial registers',
      hex: '140100041E02010107C1010F020101',
    },
    {
      description: 'TULIP3: identification message: register update message',
      hex: '14040F2102',
    },
    {
      description: 'TULIP3: identification message: Contains Serial number',
      hex: '140201AB3141303132334142433435',
    },
  ],
} as const
