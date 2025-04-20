# Secure Vault

A secure application for storing and managing encrypted text and files. Built with React, TypeScript, and Vite.

## Features

- 🔐 Strong encryption using AES
- 📝 Text and file encryption support
- 📁 Category-based organization
- 🔑 Password strength validation
- 💾 Import/Export functionality
- 🎨 Modern UI with animations
- 🌓 Dark mode support

## Getting Started

### Prerequisites

- Node.js 16.0 or later
- npm 7.0 or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/schechter-customs-LLC/vault.git
cd vault
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Security Features

- AES encryption for all stored data
- Password strength requirements:
  - Minimum 10 characters
  - Must include letters, numbers, and special characters
  - Password strength indicator
- Encrypted data stored locally
- Auto-lock functionality

## Testing

Run the test suite:

```bash
npm test
```

## Built With

- React
- TypeScript
- Vite
- Material-UI
- Crypto-JS
- LocalForage
- Framer Motion

## License

This project is licensed under the MIT License.
