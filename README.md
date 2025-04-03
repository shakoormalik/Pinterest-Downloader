# Pinterest Media Downloader

A modern web application that allows users to download videos and images from Pinterest URLs.

## Features

- Download both Pinterest images and videos in high quality
- Sleek and responsive user interface with light/dark mode support
- Tab-based format selection between videos and images
- Detailed file information (size, resolution, duration)
- Automatic content type detection
- Download history with clear all option

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express
- **Data Extraction:** Axios, Cheerio
- **Validation:** Zod
- **State Management:** React Query

## Screenshots

![Pinterest Downloader App](attached_assets/image_1743655842804.png)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pinterest-media-downloader.git
cd pinterest-media-downloader
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Paste a Pinterest URL in the input field (e.g., https://pinterest.com/pin/123456789/)
2. Click the "Search" button to fetch the content
3. Select your preferred format (HD Video, HD Image, or Standard Image)
4. Click the "Download" button to save the file to your device

## Deployment on Vercel

This is a full-stack application with separate client and server parts, which requires special configuration for Vercel deployment:

### Method 1: Deploy with Vercel CLI (Recommended)

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Make sure your project has the following files (they should be already included):
   - `vercel.json` in the root directory
   - `client/package.json` for the frontend build
   - Main `package.json` for the server

3. Login to Vercel from the command line:
   ```bash
   vercel login
   ```

4. Deploy from the project root:
   ```bash
   vercel --prod
   ```
   
5. After deployment, your app will be available at a URL provided by Vercel

### Method 2: Deploy from GitHub Repository

1. Push all project files to GitHub including:
   - `vercel.json` 
   - `client/package.json`
   - All server and client code

2. Go to [vercel.com](https://vercel.com) and create an account or sign in

3. Click "Add New Project" and select your GitHub repository

4. In the project configuration:
   - Leave the default settings as they are
   - Do NOT override the settings in vercel.json
   - Click "Deploy"

### Fixing Common Deployment Issues

If you see server code or raw files instead of your application:

1. **Make sure all required files are present**:
   - `vercel.json` in root directory with proper configuration
   - `client/package.json` with all dependencies and build script
   - `client/vite.config.ts` for Vite configuration
   - `client/tailwind.config.js` for Tailwind CSS
   - `client/postcss.config.js` for PostCSS

2. **Check the build logs in Vercel dashboard**:
   - Look for any missing dependencies
   - Ensure the client build completes successfully
   - Confirm that all paths in vercel.json are correct

3. **Project structure must match exactly**:
   ```
   /
   ├── client/          # Frontend React application
   │   ├── package.json # Client-specific package.json with dependencies
   │   ├── vite.config.ts
   │   ├── tailwind.config.js
   │   ├── postcss.config.js
   │   └── src/         # React source files
   ├── server/          # Backend Node.js/Express server
   ├── shared/          # Shared code/types
   ├── vercel.json      # Vercel deployment configuration
   └── package.json     # Main package.json
   ```

4. **For persistent issues**:
   - Try clearing the Vercel cache and redeploying
   - Use `vercel --prod --force` to force a clean deployment
   - Consider updating the Node.js version in Vercel project settings

5. **Check frontend/backend communication**:
   - Ensure API calls in the frontend use relative paths (/api/...)
   - Confirm the API routes in vercel.json match those used in the code

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.