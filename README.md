# 🔒 Encrypted Storage Frontend

A Next.js 14 zero-knowledge encrypted cloud storage frontend with client-side encryption, built with TypeScript, Tailwind CSS, and Zustand.

## 🎯 Features

- **Zero-Knowledge Encryption**: All files encrypted client-side before upload
- **AES-256-GCM Encryption**: Military-grade encryption using Web Crypto API
- **Password-Based Key Derivation**: PBKDF2 with 100,000 iterations
- **Secure Key Storage**: Master keys stored in IndexedDB encrypted with session password
- **File Upload/Download**: Drag & drop interface with encryption progress
- **Type-Safe**: Full TypeScript implementation with comprehensive types
- **Modern UI**: Responsive design with Tailwind CSS and shadcn/ui components
- **State Management**: Zustand for lightweight, scalable state management
- **Route Protection**: Middleware-based authentication and route guarding

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Encryption**: Web Crypto API + crypto-js
- **Storage**: IndexedDB (idb library)
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

### Project Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Registration page
│   │   └── layout.tsx            # Auth layout
│   ├── (dashboard)/              # Protected dashboard layout
│   │   ├── dashboard/page.tsx    # Dashboard page
│   │   ├── files/page.tsx        # File management
│   │   ├── profile/page.tsx      # User profile
│   │   └── layout.tsx            # Dashboard layout
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── files/                    # File management components
│   ├── profile/                  # Profile components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared components
│
├── lib/
│   ├── crypto/                   # Encryption implementation
│   │   ├── keyDerivation.ts      # Password → Master Key
│   │   ├── fileEncryption.ts     # File encryption/decryption
│   │   ├── metadataEncryption.ts # Metadata encryption
│   │   └── keyStorage.ts         # IndexedDB key management
│   │
│   ├── api/                      # API clients
│   │   ├── client.ts             # Axios instance
│   │   ├── auth.ts               # Auth API calls
│   │   ├── files.ts              # File API calls
│   │   └── user.ts               # User API calls
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useFiles.ts           # File management hook
│   │   ├── useEncryption.ts      # Encryption operations
│   │   └── useUpload.ts          # File upload hook
│   │
│   └── utils/                    # Utility functions
│       ├── fileUtils.ts          # File handling utilities
│       ├── formatters.ts         # Data formatters
│       └── constants.ts          # App constants
│
├── store/                        # Zustand stores
│   ├── authStore.ts              # Authentication state
│   ├── fileStore.ts              # File management state
│   └── uiStore.ts                # UI state
│
├── types/                        # TypeScript definitions
│   ├── auth.types.ts             # Auth interfaces
│   ├── file.types.ts             # File interfaces
│   ├── user.types.ts             # User interfaces
│   └── api.types.ts              # API interfaces
│
└── middleware.ts                 # Route protection
```

## 🔐 Encryption Implementation

### Key Derivation System

```typescript
// Password → Master Key using PBKDF2
const masterKey = await deriveKeyFromPassword(password, salt)

// Master key generation for new users
const masterKey = await generateMasterKey()

// Secure storage in IndexedDB
await storeMasterKey(userId, masterKey, sessionPassword)
```

### File Encryption Flow

1. **File Selection**: User selects files via drag & drop
2. **Key Generation**: Generate random AES-256 file key
3. **File Encryption**: Encrypt file data with file key (AES-GCM)
4. **Key Encryption**: Encrypt file key with master key
5. **Metadata Encryption**: Encrypt filename, size, type with master key
6. **Upload**: Send encrypted data to server
7. **Storage**: Only encrypted data stored on server

### File Decryption Flow

1. **Download**: Fetch encrypted file from server
2. **Key Decryption**: Decrypt file key using master key
3. **File Decryption**: Decrypt file data using file key
4. **Metadata Decryption**: Decrypt filename and metadata
5. **Download**: Trigger browser download with original filename

## 🎨 UI Components

### Authentication Components

- **LoginForm**: Email/password login with validation
- **RegisterForm**: Registration with password strength indicator
- **PasswordStrengthIndicator**: Real-time password validation
- **ProtectedRoute**: Route guard component

### File Management Components

- **FileUploadZone**: Drag & drop file upload with progress
- **FileList**: Paginated file list with search/filter
- **FileCard**: Individual file display with actions
- **EncryptionProgress**: Real-time encryption progress display
- **DeleteConfirmDialog**: Confirmation dialog for file deletion

### Dashboard Components

- **DashboardHeader**: Navigation and user menu
- **QuickStatsCards**: Storage usage, file count statistics
- **StorageQuotaWidget**: Visual storage usage indicator
- **RecentFilesList**: Recently uploaded files

## 🔄 State Management (Zustand)

### Auth Store
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  masterKey: CryptoKey | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (current: string, new: string) => Promise<void>
}
```

### File Store
```typescript
interface FileState {
  files: FileMetadata[]
  uploadProgress: FileUploadState
  uploadFile: (file: File) => Promise<void>
  downloadFile: (fileId: string) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
}
```

### UI Store
```typescript
interface UIState {
  isUploadModalOpen: boolean
  theme: 'light' | 'dark' | 'system'
  selectedFileId: string | null
  toggleTheme: () => void
}
```

## 🛡️ Security Features

### Client-Side Security

- **AES-256-GCM Encryption**: Industry-standard encryption
- **PBKDF2 Key Derivation**: 100,000 iterations with salt
- **Secure Random Generation**: Cryptographically secure random numbers
- **Memory Protection**: Keys cleared from memory after use
- **No Plaintext Storage**: No unencrypted data persisted

### Network Security

- **HTTPS Only**: All communications encrypted in transit
- **JWT Authentication**: Secure token-based authentication
- **Request Interceptors**: Automatic token attachment
- **CSRF Protection**: Built-in Next.js protection
- **Security Headers**: XSS, clickjacking protection

### Authentication Flow

1. **Registration**:
   ```
   User Input → Hash Password → Generate Salt → 
   Derive Master Key → Store Key (encrypted) → 
   Send Hash + Salt to Server
   ```

2. **Login**:
   ```
   User Input → Hash Password → Send Hash to Server → 
   Receive JWT → Derive Master Key → 
   Store Key (encrypted) → Access Granted
   ```

3. **Password Change**:
   ```
   Verify Current Password → Generate New Master Key → 
   Re-encrypt All Files → Update Server → 
   Store New Key
   ```

## 📱 User Experience Features

### File Upload
- Drag & drop interface
- Multiple file selection
- Real-time encryption progress
- File type validation
- Size limit enforcement
- Cancel upload option

### File Management
- Search and filter files
- Sort by name, date, size
- Bulk selection and deletion
- File preview (for images)
- Download with original filename

### Dashboard
- Storage usage visualization
- File count statistics
- Recent activity feed
- Quick action buttons

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME="Encrypted Storage"
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 🧪 TypeScript Configuration

The project uses strict TypeScript with comprehensive type definitions:

- **Strict Mode**: All TypeScript strict checks enabled
- **Path Mapping**: `@/*` aliases for clean imports
- **Interface Definitions**: Complete type coverage for all data structures
- **Generic Types**: Reusable type definitions for API responses
- **Type Guards**: Runtime type checking utilities

## 📦 Dependencies

### Core Dependencies
```json
{
  "next": "14.0.4",
  "react": "18.2.0",
  "typescript": "5.3.3",
  "zustand": "^4.4.7",
  "axios": "^1.6.2",
  "tailwindcss": "^3.4.0"
}
```

### Encryption & Security
```json
{
  "crypto-js": "^4.2.0",
  "idb": "^8.0.0",
  "jwt-decode": "^4.0.0"
}
```

### UI & Forms
```json
{
  "react-hook-form": "^7.49.2",
  "zod": "^3.22.4",
  "react-dropzone": "^14.2.3",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.303.0"
}
```

## 🔒 Security Considerations

### Client-Side Encryption Guarantees

1. **Zero Knowledge**: Server never sees plaintext data or passwords
2. **Forward Secrecy**: Each file encrypted with unique key
3. **Password Independence**: Files re-encrypted when password changes
4. **Metadata Protection**: Filenames and metadata encrypted
5. **Key Isolation**: Master key never transmitted to server

### Threat Model Protection

- ✅ **Server Breach**: Encrypted data useless without keys
- ✅ **Man-in-the-Middle**: Data encrypted before transmission
- ✅ **Password Compromise**: Individual breach doesn't affect others
- ✅ **Client Compromise**: Keys cleared from memory
- ❌ **Device Compromise**: Local keys can be accessed
- ❌ **Password Loss**: No recovery possible (by design)

### Best Practices Implemented

- Secure random number generation
- Memory-safe key handling
- Constant-time comparisons where applicable
- Input validation and sanitization
- XSS and CSRF protection
- Secure cookie handling

## 🚀 Performance Optimizations

### Code Splitting
- Route-based code splitting with Next.js App Router
- Dynamic imports for heavy components
- Lazy loading of encryption libraries

### File Handling
- Streaming encryption for large files
- Chunk-based upload/download
- Progress tracking for user feedback
- Background processing for encryption

### State Management
- Optimized Zustand stores with selective subscriptions
- Memoized components with React.memo
- Efficient re-rendering with proper dependency arrays

## 🧩 Extension Points

The architecture supports easy extension:

### New File Types
Add support in `fileUtils.ts`:
```typescript
export const ALLOWED_FILE_TYPES = [
  // Add new MIME types
]
```

### Additional Encryption Methods
Extend crypto library:
```typescript
// lib/crypto/advancedEncryption.ts
export async function encryptWithCustomMethod() {
  // Implementation
}
```

### New UI Components
Follow established patterns:
```typescript
// components/feature/NewComponent.tsx
export function NewComponent() {
  const { state, actions } = useStore()
  return <div>...</div>
}
```

## 📈 Monitoring & Debugging

### Error Handling
- Global error boundaries
- API error interceptors  
- Toast notifications for user feedback
- Console logging for development

### Performance Monitoring
- Bundle analyzer integration
- Core Web Vitals tracking
- Encryption performance metrics

## 🤝 Contributing

1. Follow established TypeScript patterns
2. Maintain comprehensive type definitions
3. Add unit tests for new features
4. Update documentation for API changes
5. Follow security best practices

## 📄 License

This project implements a secure, zero-knowledge encrypted storage frontend with modern web technologies, providing users complete privacy and control over their data.

---

**Important Security Note**: This implementation prioritizes security and privacy. Users must understand that forgotten passwords mean permanent data loss - this is by design and proves the zero-knowledge architecture.