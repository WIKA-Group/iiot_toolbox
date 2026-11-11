# Device Parsers Guide

This guide explains how to use the device parser UI to decode uplinks, encode downlinks, and download a ready-to-use parser for your device, no coding required.

## Overview

Every device page has the same layout:

- **Header:** Device name, measurand, supported protocols, and the "Download parser" button.
- **Decode tab:** Turns a received uplink payload into readable values. It is open by default and also contains the parser settings.
- **Encode tab:** Builds a downlink frame from a form. Select the tab to open it. It is only shown for devices that support downlinks, for example not for A2G.

All inputs, such as the selected tab, protocol, payload, settings, and form values, are stored in the page URL. Bookmark the link or send it to colleagues or support to share your current state.

## Decoding

Decoding is shown as soon as you open a device. To decode an uplink:

1. Paste the received payload as a hexadecimal string into the "Payload" field. Spaces, line breaks, and a leading `0x` are accepted. Alternatively, choose an example from the "Example" list, if the device has examples.
2. Read the result. It updates automatically while you type.
3. Check the status next to the result title. It shows "Decoded", "Error", or "Awaiting payload".

The result panel offers the following:

- **Table and raw JSON:** Switch between a table of values and the raw JSON.
- **Units:** The table shows units where the device defines them. Otherwise it shows the values exactly as the parser reports them.
- **Copy:** Copy the result as JSON.
- **Warnings:** Parser warnings are listed below the result.

The UI reports malformed input immediately, for example non-hexadecimal characters or an incomplete byte. On small screens, a "Show result" button jumps to the result panel.

### Parser Settings

The "Parser settings" section below the payload field adjusts the parser to your device. The settings change the decoded values and are included in the downloaded parser.

| Setting | Description |
| --- | --- |
| Decimal places | Number of decimals in decoded values. Whole number of 0 or more. Default: 4. |
| Measuring ranges | Start and end value per channel. Shown only for devices with adjustable channels. |

For measuring ranges, enter both limits, with the start lower than the end, or clear both fields to use the device default. "Reset" restores the default. A2G and NETRIS2 have no adjustable channels, so only decimal places are shown.

Invalid settings are marked on the field. While a setting is invalid, nothing is decoded and the parser download is blocked.

## Encoding

Select the "Encode" tab to create a downlink frame. To encode a downlink:

1. Select the protocol (TULIP2 or TULIP3), if the device supports more than one.
2. Select an action. The list separates actions that generate the frame immediately from actions that need input.
3. Fill in the parameters of the action. The UI validates your input and reports immediately if a value is out of range or a required field is missing.
4. Copy the frame from the "Downlink frame" panel.

The frame appears as soon as the inputs are valid and updates whenever you change a value. While inputs are incomplete, the panel tells you what is still missing. Errors are shown in red. "Reset form" clears all inputs of the current action.

### Downlink Frame

The "Downlink frame" panel shows the status ("Encoded", "Error", or "Nothing encoded"), the frame in hex, its size in bytes, and the fPort. Use the copy button to copy the frame. The menu next to it offers other formats:

- Hex with `0x` prefix.
- Hex without prefix.
- Base64.

Some downlinks need several frames. The panel then shows every frame with its own copy button and "Copy all". Send the frames in the order shown.

### TULIP2 Actions

| Action | Input |
| --- | --- |
| Restore defaults | None. |
| Reset battery | None. |
| Drop configuration | Configuration ID, if the device uses it. |
| Configuration | Main configuration and channel values. See below. |
| Get configuration | Configuration blocks to read back. |

The available actions depend on the device. The Configuration ID matches configuration commands and responses. It must be a whole number of 1 or more. Increment it for each new configuration you send.

The configuration form has the following sections:

- **Main settings:** Measuring rates and publication factors for normal and alarm conditions. The UI shows the resulting transmission interval. Fill in every field or leave all empty.
- **Channels:** One section per channel. The number and names of channels depend on the device.

Each channel offers these values, depending on the device:

- Dead band, required as soon as any alarm value is set.
- Low and high thresholds, with or without delay.
- Rising and falling slope.
- Start-up time.
- Measure offset.

A channel can also be switched on or off instead of configured. Switching sends a different downlink and replaces the entered values. Many fields have tooltips with explanations, valid ranges, and units.

### TULIP3 Actions

| Action | Input |
| --- | --- |
| Close session | None. |
| Restore defaults | None. |
| Reset battery | None. |
| Alarm status | Alarm types to request: process, communication module, sensor, and channel alarms. Select at least one. |
| Read registers | Registers to read. Select at least one. |
| Write registers | Values for the registers to change. |

Registers are grouped by communication module, sensor, and channel. For "Write registers", enter a value only for registers you want to change. Entries that belong together, such as the entries of a set, must be filled in completely, because unset entries would be switched off. The UI shows the resulting transmission interval for measuring period and transmission rate. Values outside the recommended range show an advisory, but still encode.

"Read registers" and "Write registers" can span several frames. The "Max. frame size" field above the action options limits the size of each frame in bytes, headers included. The default is 51 bytes. Raise it to the payload limit of your network to need fewer frames. The minimum is 11 bytes. The setting applies to the encoded frames only and is not part of the downloaded parser.

## Download and Usage

The "Download parser" button in the page header saves the parser script together with your current settings, decimal places and measuring ranges. It is blocked while a setting is invalid, so the file always matches what you verified on the page. To use the parser in a network server or gateway:

1. Verify your settings and your decoded or encoded frames on the device page.
2. Download the parser.
3. Upload or paste the script into the custom decoder or encoder section of your network server or gateway. Your settings are already included, so no further adjustments are needed.

The downloadable parser comes from the same pinned release of the JavaScript parsers that this site is built against. It behaves exactly like the decoding and encoding you verified here. The pinned version is updated only after a new release has been checked against this site.

### LoRa Alliance Payload Codec API Compliance

The downloaded parser is compliant with the [LoRa Alliance Payload Codec API spec](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api). Some network server or gateway providers do not fully adhere to this specification. If your network server requires a specific function signature or export, add a small wrapper at the end of the downloaded file. For example, for a server that expects a `Decode(fPort, bytes)` function:

```js
function Decode(fPort, bytes) {
  return decodeUplink({ bytes, fPort })
}
```

## Further Resources

For more advanced features or to integrate the parser into your own application, see:

- [Parsers repository](https://github.com/WIKA-Group/javascript_parsers)
- [Server and web examples](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples)
- [`@w2a-iiot/parsers` on npm](https://www.npmjs.com/package/@w2a-iiot/parsers), the official package the examples are based on
