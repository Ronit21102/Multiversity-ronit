# Collaboration Backend

HocusPocus server for real-time collaborative editing.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Server Details

- WebSocket server runs on `ws://localhost:1234`
- Supports real-time collaboration
- CORS enabled for frontend at `http://localhost:3000`

## Usage

The server will automatically handle document synchronization when users connect from the frontend editor.
