# NaoNao - Voice Dictation with Wake Word Detection

A modern Electron-based voice dictation application with wake word detection, built with React, TypeScript, and Tailwind CSS.

_Originally created because Notion AI removed its dictation feature._

## Features

- 🎤 **Wake Word Detection** - Hands-free activation using Porcupine wake word engine
- 🗣️ **Voice Transcription** - Powered by OpenAI Whisper
- ⌨️ **Auto-Typing** - Automatically types transcribed text
- 📊 **History** - Keep track of all your transcriptions
- ⚙️ **Customizable Settings** - Adjust sensitivity, recording duration, and more
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui
- 💾 **Local Database** - All data stored locally using SQLite

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Picovoice Console account for Porcupine API key (https://console.picovoice.ai/)
- OpenAI API key (for cloud transcription)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
```
VITE_PORCUPINE_ACCESS_KEY=your_porcupine_key_here
VITE_OPENAI_API_KEY=your_openai_key_here
```

### Development

Start the development server:
```bash
npm start
```

### Building

Build the application:
```bash
npm run package
```

Create distributable packages:
```bash
npm run make
```

## Usage

1. Launch the application
2. Click "Start Listening" to activate wake word detection
3. Say the wake word "Picovoice" (or your custom wake word)
4. Speak your dictation
5. The app will automatically transcribe and type your text

## Configuration

### Wake Word

The default wake word is "Picovoice". To use a custom wake word:

1. Create a custom wake word at https://console.picovoice.ai/
2. Download the `.ppn` file
3. Place it in the `src/assets` directory
4. Update the wake word service to use your custom file

### Settings

Adjust various settings in the Settings tab:
- Wake word sensitivity
- Silence threshold for auto-stop
- Maximum recording duration
- Auto-type toggle

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Porcupine** - Wake word detection
- **OpenAI Whisper** - Speech transcription
- **better-sqlite3** - Local database

## Current Limitations

- **Text Typing**: Currently copies transcribed text to clipboard. You'll need to paste manually (Ctrl+V). Future versions will implement platform-specific keyboard automation.
- **Custom Wake Words**: The default wake word is "Picovoice". Custom wake words require a `.ppn` file from Picovoice Console.

## Python Backup

The original Python implementation has been archived in `python-backup-2025-12-03-102144.zip` for reference.

## License

MIT

## Acknowledgments

- Inspired by [Amical](https://github.com/amicalhq/amical)
- Built with [Electron Forge](https://www.electronforge.io/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
