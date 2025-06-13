# Device Parsers Guide

This guide explains how to use the device parser UI to configure, encode, and decode payloads for your device, no coding required.

---

## Supported Parsers

- [**NETRIS2**](/parsers/netris2) (channels fixed to 4 to 20 mA, cannot change min, max, or unit)

*Note: Support for additional device parsers is coming soon.*

---

## Features

- **Tabbed Interface:**  
  At the top of the page, you will find tabs for "Encoding" and "Decoding". Click a tab to switch between configuring downlinks and decoding uplinks.
  <!-- Image: Screenshot of the tab navigation at the top, with "Encoding" and "Decoding" tabs visible and highlighted. -->

- **Link Sharing:**  
  All your configuration data is stored in the page URL. You can bookmark or share the link to save or send your current settings and form state to others. This makes collaboration and support much easier.
  <!-- Image: Illustration showing a user copying the URL and sharing it, with a tooltip "All settings are saved in the link!" -->

---

## Parser Configuration

Before you start encoding or decoding, you may need to configure the parser to match your device's measurement ranges and units.  
Depending on your device and where it is used, the available ranges, units, and channel count may differ.  
You can set these options in the parser configuration section at the top of the page.

*Note: For NETRIS2, the measurement ranges (min, max, unit) are fixed to 4 to 20 mA and cannot be changed.*

---

## Settings

- **Encoder Settings:**  
  At the top of the encoding form, you can set general device parameters such as the Configuration ID, which is used to match configuration commands and responses, and the LoRaWAN Spreading Factor, which affects range and data rate.
  <!-- Image: Screenshot of the Encoder Settings section, with fields for Configuration ID and Spreading Factor, and tooltips visible. -->

---

## Encoding

- **Configuration Form:**  
  The main area of the "Encoding" tab is a form split into logical sections:
  - **Quick Actions:** Buttons for factory reset and battery indicator reset.
    <!-- Image: Screenshot of the Quick Actions section with "Factory Reset" and "Reset Battery Indicator" buttons. -->
  - **Encoder Settings:** General device settings as described above.
  - **Main Configuration:** Set measurement rates and publication factors for both normal and alarm conditions. The UI will show you the resulting transmission interval.
    <!-- Image: Screenshot of the Main Configuration section, with a highlighted info box showing the calculated transmission interval. -->
  - **Channel Tabs:**  
    The UI provides a section or tab for each available channel. The number of channels shown depends on the device you are configuring. Some devices may have two channels, while others may have more.  
    The available options and fields for each channel may also vary depending on the device.
    For each channel, you can:
      - Enable or disable the channel.
      - Set thresholds for alarms, including low or high thresholds, with or without delay.
      - Configure dead band, slope alarms (rising or falling), measurement offset, and start-up time.
      - All fields have tooltips and hints to guide you, including valid ranges and units.
  
    <!-- Image: Screenshot of a generic channel tab open, showing all configuration fields, tooltips, and a disabled min/max/unit field for NETRIS2. -->
    <!-- Image: Tooltip popup with an explanation and a small diagram for a threshold alarm. -->
  - **Field Validation:** The UI checks your input and provides immediate feedback if a value is out of range or a required field is missing.
    <!-- Image: Screenshot showing a validation error message below a field, e.g., "Value must be between 4 and 20 mA". -->
  - **Tooltips and Visuals:** Many fields include tooltips with explanations and images to help you understand what each setting does.
    <!-- Image: Tooltip with a diagram for "Dead Band" or "Slope Alarm". -->

- **Encode Downlink:**  
  After filling out the form, click the "Encode Downlink" button. The encoded frame or frames will appear in a results panel, ready to copy or download.
  <!-- Image: Screenshot of the results panel showing the encoded downlink frame in hex format, with "Copy" and "Download" buttons. -->

- **What you can do:**  
  - Configure all device settings visually, with immediate feedback and help.
  - Save and share your configuration via URL.
  - Instantly generate valid downlink frames for your device.
  - Use quick actions for common device resets.

- **Encoding Configuration May Vary:**  
  The available encoding configuration options and fields may differ depending on the device you are working with. Some devices offer more channels or different alarm and measurement settings. The encode page will automatically adapt to show only the relevant options for your selected device.

---

## Decoding

- **Decode Uplink:**  
  Switch to the "Decoding" tab to access the uplink decoder.
  - Paste your received payload, either in hex or base64, into the input field.
    <!-- Image: Screenshot of the Decoding tab with a textarea for pasting the hex string, and a sample payload entered. -->
  - The UI will automatically decode and display the interpreted data in a readable format.
    <!-- Image: Screenshot of the decoded JSON result, with field names, values, and units clearly shown. -->
  - Decoded values are shown with units and field names for clarity.
  - Any errors or warnings are displayed below the result.
    <!-- Image: Screenshot showing a warning or error message below the decoded result, e.g., "Warning: Value out of expected range". -->

- **What you can do:**  
  - Instantly decode uplink payloads from your device.
  - See all decoded values, alarms, and status fields with clear labels and units.
  - Share the decoded result with support or colleagues.

---

## Download and Usage

- **Download Encoded Frames:**  
  The results panel in the encoding tab allows you to copy the encoded frames to your clipboard or download them as a file.
  <!-- Image: Screenshot of the download and copy buttons in the results panel. -->

- **Download the Parser with Your Settings:**  
  When you download the parser script from the encode page, it automatically includes all your current settings, such as channel configuration, rounding decimals, and other options. This means that after you have verified your configuration and ensured the encoded frames are correct, you can download a parser that is ready to use with your device and settings. No further adjustments are needed after download.

- **Always Up to Date:**  
  The downloadable parser is always kept in sync with the latest release of the JavaScript parsers. You can be confident that you are using the most recent and reliable version.

- **Bookmarking and Sharing:**  
  Since all configuration data is stored in the URL, you can bookmark your current configuration or share it with colleagues or support for troubleshooting.
  <!-- Image: Illustration of sharing a link with a colleague, with a "Configuration loaded!" banner. -->

---

## LoRa Alliance Payload Codec API Compliance

The downloaded parser is fully compliant with the [LoRa Alliance Payload Codec API spec](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api). However, some network server or gateway providers may not fully adhere to the LoRa Alliance Payload Codec API specification. In such cases, you might need to add a small code snippet at the end of the downloaded file to adapt it for your specific environment.

---

## Usage in a Network Server or Gateway

Once you have downloaded the parser with your verified settings:
1. Upload or paste the parser script into your network server or gateway's custom decoder or encoder section.
2. No further configuration is needed, as your settings are already included.
3. If your network server requires a specific function signature or export, you may need to add a small code snippet at the end of the file.

*Example workflow:*
- Configure and verify your settings in the encode page.
- Download the parser.
- Upload the parser to your network server.
- If needed, add a small code snippet for compatibility. See below for examples.

---


<!--

## Examples for Adapting the Parser to Different Network Servers

  Loriot:
    Add a wrapper function at the end of the downloaded file:
      function Decode(fPort, bytes) { return decodeUplink({ bytes, fPort }); }
  The Things Network (TTN):
    Export the decodeUplink function as the main decoder.
  ChirpStack:
    Use the decodeUplink function directly, or wrap as needed.
  ...add more as needed.
-->

<!--

## Example Screenshots

  1. Tab navigation at the top, with "Encoding" and "Decoding" tabs.
  2. Encoder Settings section with tooltips open.
  3. Generic channel tab with all fields, tooltips, and disabled min/max/unit for NETRIS2.
  4. Main Configuration section with calculated transmission interval info box.
  5. Validation error message below a field.
  6. Tooltip with diagram for "Dead Band".
  7. Quick Actions section with reset buttons.
  8. Results panel with encoded frame, copy, and download buttons.
  9. Decoding tab with textarea and sample payload.
  10. Decoded JSON result with warnings/errors.
  11. Illustration of sharing a configuration link.
  12. Illustration of pasting a frame into a network server UI.

---

-->
*If you need more advanced features or want to integrate the parser into your own application, please refer directly to the [parsers repository](https://github.com/WIKA-Group/javascript_parsers) and the [server and web examples](https://github.com/WIKA-Group/javascript_parsers/tree/main/examples). These examples are based on the official [`@w2a-iiot/parsers`](https://www.npmjs.com/package/@w2a-iiot/parsers) npm package.*