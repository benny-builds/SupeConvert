<div align="center">

<img src="frontend/public/SupeConvert Logo Transparent.svg" alt="SupeConvert Logo" width="120" />

# SupeConvert

**A fast desktop batch image converter**

Offline, multi-threaded conversion for hundreds of image formats.

<br />

[![Download](https://img.shields.io/badge/Download-Latest_Release-2ea44f?style=for-the-badge&logo=github&logoColor=white)](https://github.com/user/SupeConvert/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/user/SupeConvert/releases)
[![License](https://img.shields.io/badge/License-MIT-F7B93E?style=for-the-badge)](LICENSE)

![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat-square&logo=go&logoColor=white)
![Wails](https://img.shields.io/badge/Wails-v2-DF0000?style=flat-square&logo=wails&logoColor=white)
![React](https://img.shields.io/badge/React-UI-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

<br />

[Overview](#overview) &nbsp;â€¢&nbsp;
[Features](#features) &nbsp;â€¢&nbsp;
[Installation](#installation) &nbsp;â€¢&nbsp;
[Development](#development) &nbsp;â€¢&nbsp;
[Contributing](#contributing) &nbsp;â€¢&nbsp;
[License](#license)

</div>

---

## Overview

SupeConvert is a lightweight desktop app for converting large batches of images. It runs entirely on your machine, with no cloud services and no network calls. It reads over 520 input formats and writes more than 75 output formats, which puts it in the same league as tools like XnConvert.

---

## Features

| Feature | Description |
| :--- | :--- |
| **Parallel processing** | A configurable worker pool (1 to 16 threads) keeps your CPU busy while converting. |
| **Wide format support** | Reads web graphics, camera RAW, next-gen formats, vector files, game textures, HDR, and medical imaging. |
| **Filename templates** | Build output names from a pattern and see a live preview as you type. |
| **Re-processing prompt** | If output files already exist, choose to skip them or convert everything again. |
| **Private by design** | Everything is processed locally, with no telemetry. |

<details>
<summary><b>Supported format highlights</b></summary>

<br />

| Category | Formats |
| :--- | :--- |
| Camera RAW | `CR2`, `NEF`, `ARW`, `DNG` |
| Next-gen | `AVIF`, `HEIC`, `JXL` |
| Vector | `SVG`, `PDF`, `EPS` |
| Textures | `DDS`, `TGA`, `PCX`, `VTF` |
| Medical | `DICOM` |
| Other | Web graphics, HDR, and hundreds more |

</details>

<details>
<summary><b>Filename template tokens</b></summary>

<br />

| Token | Meaning |
| :--- | :--- |
| `{name}` | Original file name |
| `{w}` | Image width |
| `{h}` | Image height |
| `{index}` | Position in the batch |
| `{ext}` | Output extension |

</details>

---

## Installation

> You don't need Go, Node.js, or any developer tools to use SupeConvert.

### Windows installer

[![Get Installer](https://img.shields.io/badge/Get-SupeConvert_Setup.exe-2ea44f?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/user/SupeConvert/releases)

1. Download `SupeConvert Setup.exe` from the [Releases](https://github.com/user/SupeConvert/releases) page.
2. Run it. SupeConvert is installed to `C:\Program Files\SupeConvert`, with Start Menu and Desktop shortcuts and an entry in Control Panel for uninstalling.

---
