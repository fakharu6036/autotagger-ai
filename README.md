<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PiTagger - Professional AI Metadata Tagging

PiTagger is a powerful browser-based application for automatically generating SEO-optimized metadata, titles, descriptions, and keywords for stock assets using Google's Gemini AI.

## Features

- 🤖 **AI-Powered Metadata Generation** - Automatically generates optimized titles, descriptions, and keywords
- 🎯 **SEO Validated** - Ensures your metadata meets stock platform requirements
- ⚡ **Parallel Processing** - Support for multiple API keys to increase processing capacity
- 📁 **Batch Processing** - Upload and process multiple files at once
- 💾 **Multiple Export Formats** - Export to CSV for Adobe Stock, Shutterstock, Getty/iStock, or standard format
- 🔒 **Client-Side Security** - API keys stored locally in your browser

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- A Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pitagger
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Adding Your API Key

**Important:** PiTagger stores API keys securely in your browser's localStorage. No server-side configuration is needed.

1. Click the **Settings** icon (⚙️) in the top right corner
2. Go to the **API Keys** tab
3. Enter your Gemini API key and an optional label
4. Click **Add Key** - the key will be verified before being saved
5. You can add multiple keys to increase processing capacity

Your API keys are stored locally in your browser and never sent to any server except Google's Gemini API.

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

### Deployment

This is a static application that can be deployed to any static hosting provider:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Deploy the `dist` folder contents
- **Any static hosting**: Upload the contents of `dist` folder

No server-side configuration is required - all API keys are managed client-side through the Settings interface.

## Usage

1. **Upload Files**: Drag and drop or click to select image/video files
2. **Configure Settings**: Add your Gemini API key(s) in Settings
3. **Start Processing**: Click "Run Analysis" to begin generating metadata
4. **Review & Edit**: Click on any file to view and edit the generated metadata
5. **Export**: Export your files as CSV or download as a ZIP archive

## License

Copyright © 2024 designpi.com
