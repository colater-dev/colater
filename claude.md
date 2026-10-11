# Brand Canvas (Colater)

A comprehensive Next.js application for creating and managing professional brand identities with AI-powered assistance. Generate logos, taglines, visual presentations, and complete brand guidelines using Firebase and multiple AI providers.

## Overview

Brand Canvas (Colater) helps users craft their brand identity effortlessly by providing:

- Google Sign-in authentication with redirect flow
- Brand creation and management with real-time updates
- AI-powered brand detail suggestions (name, pitch, audience, cues, concepts)
- Multiple AI providers for logo generation (OpenAI DALL-E, Fal.ai, Google Imagen)
- AI-generated taglines (3 per generation)
- Logo colorization with automatic palette extraction
- Logo critique and feedback system with visual annotations
- Logo vectorization capabilities
- Brand presentation mode with animated slides
- Logo detail pages with mockup previews
- Image-based brand creation (start from existing logo)
- Moodboard creation with Unsplash integration
- Logo ranking and feedback system for prompt improvement
- Customizable brand fonts with Google Fonts integration
- Real-time collaborative features
- Firebase Firestore for data persistence
- Cloudflare R2 for optimized media storage
- Firebase Storage for legacy support

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router, Turbopack)
- **Language**: TypeScript 5+ (strict mode enabled)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4 with shadcn/ui components
- **Animation**: Framer Motion 11.3, Motion 12.23
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Storage**: Cloudflare R2 (primary), Firebase Storage (legacy)
- **AI Providers**:
  - Google Genkit 1.27 with Google Generative AI
  - OpenAI API (DALL-E 3)
  - Fal.ai (Flux models)
- **Forms**: React Hook Form 7.54 with Zod 3.24 validation
- **State Management**: React Context (Firebase Provider)
- **Auth**: NextAuth 5.0 (beta)
- **Image Processing**: html-to-image, get-image-colors
- **Utilities**: date-fns, uuid, p5.js (generative art)
- **Build Tool**: Next.js with Turbopack

## Architecture

### Feature-Based Organization

The codebase follows a feature-based architecture with clear separation of concerns:

- **`features/`** - Feature modules with co-located components and hooks
- **`services/`** - Business logic and data access layer
- **`app/`** - Next.js app router pages (thin presentation layer)
- **`components/`** - Shared UI components with sub-organization
- **`lib/`** - Shared utilities and type definitions
- **`ai/`** - AI flow definitions and prompt management
- **`config/`** - Configuration files (fonts, etc.)

### Key Architectural Decisions

1. **Service Layer Pattern**: Firestore operations abstracted behind service classes
2. **Auth Guard Hook**: Standardized authentication checks with `useRequireAuth`
3. **Component Extraction**: Large pages broken into focused, testable components
4. **Type Safety**: Full TypeScript coverage with no ignored errors
5. **Memoization**: Firebase queries and service instances memoized for performance
6. **Client-Server Split**: Pages use server components with client components for interactivity
7. **Multi-Provider AI**: Support for multiple logo generation providers with unified interface
8. **Structured Prompts**: AI prompts managed in separate directory for maintainability

## Project Structure

```
src/
├── ai/                          # AI flow definitions using Genkit
│   ├── flows/
│   │   ├── colorize-logo.ts              # Logo colorization flow
│   │   ├── complete-brand-details.ts     # Complete partial brand details
│   │   ├── critique-logo.ts              # Generate visual logo critiques
│   │   ├── generate-brand-details.ts     # Brand detail generation
│   │   ├── generate-logo-concept.ts      # Generate logo concept before image
│   │   ├── generate-logo-fal.ts          # Fal.ai logo generation
│   │   ├── generate-logo-openai.ts       # OpenAI DALL-E logo generation
│   │   ├── generate-logo.ts              # Google Imagen logo generation
│   │   ├── generate-presentation-data.ts # Presentation slide data
│   │   ├── generate-stories.ts           # Brand stories generation
│   │   ├── generate-tagline.ts           # Tagline generation flow
│   │   ├── justify-logo.ts               # Justify logo design decisions
│   │   └── vectorise-logo.ts             # Convert raster to vector
│   ├── prompts/
│   │   └── generate-logo/                # Logo generation prompts
│   ├── dev.ts                            # Genkit development server
│   └── genkit.ts                         # Genkit configuration
│
├── app/                         # Next.js app router pages (presentation layer)
│   ├── brands/
│   │   ├── [brandId]/
│   │   │   ├── logos/
│   │   │   │   └── [logoId]/
│   │   │   │       ├── logo-detail-client.tsx    # Logo detail page client
│   │   │   │       └── page.tsx                  # Logo detail page
│   │   │   ├── presentation/
│   │   │   │   ├── presentation-client.tsx       # Presentation mode client
│   │   │   │   └── page.tsx                      # Presentation mode page
│   │   │   ├── settings/
│   │   │   │   └── page.tsx                      # Brand settings (API keys, integrations)
│   │   │   ├── brand-detail-client.tsx           # Brand detail page client (672 lines)
│   │   │   └── page.tsx                          # Brand detail page
│   │   └── new/
│   │       ├── new-brand-client.tsx              # New brand form client
│   │       └── page.tsx                          # New brand creation form
│   ├── dashboard/
│   │   ├── dashboard-client.tsx                  # Dashboard client
│   │   └── page.tsx                              # User dashboard with brand list
│   ├── ranker/
│   │   ├── ranker-client.tsx                     # Logo ranking interface client
│   │   └── page.tsx                              # Logo ranking page
│   ├── start-from-image/
│   │   ├── start-from-image-client.tsx           # Upload logo to start client
│   │   └── page.tsx                              # Start from existing image
│   ├── taglines/
│   │   ├── taglines-client.tsx                   # Taglines page client
│   │   └── page.tsx                              # Standalone taglines page
│   ├── actions/
│   │   └── upload-media.ts                       # Media upload server action
│   ├── api/
│   │   └── images/
│   │       └── search/
│   │           └── route.ts                      # Unsplash image search API
│   ├── fonts/                                    # Font files
│   ├── actions.ts                                # Server actions for AI operations
│   ├── layout.tsx                                # Root layout with Firebase provider
│   ├── page.tsx                                  # Landing page
│   ├── home-client.tsx                           # Landing page client component
│   └── globals.css                               # Global styles
│
├── features/                    # Feature-based modules
│   ├── auth/
│   │   └── hooks/
│   │       ├── use-require-auth.tsx              # Auth guard hook
│   │       └── index.ts
│   ├── brands/
│   │   └── components/
│   │       ├── brand-applications.tsx            # Logo mockup applications
│   │       ├── brand-header.tsx                  # Brand info display
│   │       ├── brand-identity-card.tsx           # Logo & tagline card (666 lines)
│   │       ├── brand-identity-header.tsx         # Identity section header
│   │       ├── critique-point.tsx                # Visual critique annotation
│   │       ├── download-button.tsx               # Download logo button
│   │       ├── logo-controls.tsx                 # Logo display controls
│   │       ├── logo-feedback-form.tsx            # Logo feedback form
│   │       ├── logo-navigation-dock.tsx          # Logo pagination dock
│   │       ├── logo-preview-card.tsx             # Logo preview with actions
│   │       ├── logo-showcase.tsx                 # Main logo display (51k+ chars)
│   │       ├── mockup-preview.tsx                # Mockup template preview
│   │       ├── palette-dots.tsx                  # Color palette display
│   │       ├── sticker-preview.tsx               # Sticker mockup preview
│   │       ├── taglines-list.tsx                 # Taglines management
│   │       ├── brand-api-keys-tab.tsx            # API key management tab
│   │       ├── brand-integrations-tab.tsx        # MCP setup wizard, playground, snippets
│   │       └── index.ts
│   └── moodboard/
│       ├── components/
│       │   ├── moodboard.tsx                     # Moodboard grid
│       │   └── moodboard-card.tsx                # Moodboard image card
│       └── types.ts                              # Unsplash API types
│
├── services/                    # Business logic / data access layer
│   ├── brand.service.ts                          # Brand CRUD operations
│   ├── tagline.service.ts                        # Tagline operations
│   ├── logo.service.ts                           # Logo operations
│   └── index.ts
│
├── components/
│   ├── ui/                                       # shadcn/ui components (40+ components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   ├── toast.tsx
│   │   ├── pill-input.tsx                        # Custom pill input component
│   │   └── ... (35+ more)
│   ├── animate-ui/                               # Animation components
│   │   ├── icons/                                # Animated icon components
│   │   └── primitives/                           # Animation primitives
│   ├── dashboard/                                # Dashboard-specific components
│   │   ├── create-project-card.tsx               # Create new project card
│   │   └── upload-logo-card.tsx                  # Upload logo card
│   ├── layout/                                   # Layout components
│   │   ├── app-header.tsx                        # Application header
│   │   ├── app-sidebar.tsx                       # Application sidebar
│   │   ├── client-layout.tsx                     # Client-side layout wrapper
│   │   ├── content-card.tsx                      # Content card wrapper
│   │   ├── sidebar-context.tsx                   # Sidebar state context
│   │   └── index.ts
│   ├── FirebaseErrorListener.tsx                 # Error handling component
│   └── user-chip.tsx                             # User profile chip
│
├── firebase/                    # Firebase configuration and utilities
│   ├── firestore/
│   │   ├── use-collection.tsx                    # Firestore collection hook
│   │   └── use-doc.tsx                           # Firestore document hook
│   ├── client-provider.tsx                       # Client-side Firebase initialization
│   ├── config.ts                                 # Firebase configuration
│   ├── error-emitter.ts                          # Error event emitter
│   ├── errors.ts                                 # Custom error classes
│   ├── index.ts                                  # Public Firebase API exports
│   ├── non-blocking-login.tsx                    # Non-blocking login component
│   ├── non-blocking-updates.tsx                  # Non-blocking updates component
│   ├── provider.tsx                              # Firebase context provider
│   └── server.ts                                 # Server-side Firebase utilities
│
├── hooks/
│   ├── use-mobile.tsx                            # Mobile detection hook
│   └── use-toast.ts                              # Toast notification hook
│
├── config/
│   └── brand-fonts.ts                            # Google Fonts configuration (27 fonts)
│
└── lib/
    ├── color-utils.ts                            # Color conversion utilities
    ├── image-utils.ts                            # Image processing utilities
    ├── placeholder-images.ts                     # Placeholder image utilities
    ├── r2-upload-client.ts                       # R2 client-side upload
    ├── r2-upload.ts                              # R2 server-side upload
    ├── r2.ts                                     # R2 configuration
    ├── storage-utils.ts                          # Storage utilities
    ├── types.ts                                  # TypeScript type definitions
    └── utils.ts                                  # Utility functions (cn, etc.)
```

## Core Concepts

### 1. Service Layer Pattern

The service layer provides a clean abstraction over Firestore operations, encapsulating path construction and CRUD operations.

#### BrandService

**Location**: `src/services/brand.service.ts`

```typescript
import { createBrandService } from '@/services';

const brandService = useMemo(() => createBrandService(firestore), [firestore]);

// Create a new brand
const brandId = await brandService.createBrand(userId, {
  latestName: 'My Brand',
  latestElevatorPitch: 'A revolutionary product...',
  latestAudience: 'Tech-savvy millennials',
  latestDesirableCues: 'modern, sleek, professional',
  latestUndesirableCues: 'dated, cluttered',
  latestConcept: 'A minimalist tech-forward identity',
});

// Get brands collection reference
const brandsCollection = brandService.getBrandsCollection(userId);

// Get brands query (ordered by creation date)
const brandsQuery = brandService.getBrandsQuery(userId);

// Get brand document reference
const brandDoc = brandService.getBrandDoc(userId, brandId);

// Update brand
await brandService.updateBrand(userId, brandId, {
  latestName: 'New Name',
  font: 'Jost'
});

// Update logo
await brandService.updateBrandLogo(userId, brandId, logoUrl);

// Update tagline
await brandService.updateBrandTagline(userId, brandId, tagline);

// Delete brand
await brandService.deleteBrand(userId, brandId);
```

**Benefits**:
- Encapsulates Firestore path construction
- Type-safe operations
- Consistent error handling
- Easy to test and mock
- DRY principle

#### TaglineService

**Location**: `src/services/tagline.service.ts`

```typescript
const taglineService = useMemo(() => createTaglineService(firestore), [firestore]);

// Create single tagline
const taglineId = await taglineService.createTagline(
  userId,
  brandId,
  'Your perfect tagline'
);

// Create multiple taglines (batch)
const taglineIds = await taglineService.createMultipleTaglines(
  userId,
  brandId,
  ['tagline1', 'tagline2', 'tagline3']
);

// Update tagline status (liked, disliked, generated)
await taglineService.updateTaglineStatus(
  userId,
  brandId,
  taglineId,
  'liked'
);

// Get taglines query
const taglinesQuery = taglineService.getTaglinesQuery(userId, brandId);

// Delete tagline
await taglineService.deleteTagline(userId, brandId, taglineId);
```

#### LogoService

**Location**: `src/services/logo.service.ts`

```typescript
const logoService = useMemo(() => createLogoService(firestore), [firestore]);

// Create logo
const logoId = await logoService.createLogo(userId, brandId, {
  logoUrl,
  prompt: 'Generated with DALL-E',
  concept: 'Minimalist geometric shape',
});

// Add colorized version with palette
await logoService.updateLogoWithColor(
  userId,
  brandId,
  logoId,
  {
    colorLogoUrl,
    palette: ['#FF5733', '#33FF57', '#3357FF'],
    colorNames: ['Vibrant Red', 'Fresh Green', 'Ocean Blue']
  }
);

// Update display settings
await logoService.updateLogoDisplaySettings(
  userId,
  brandId,
  logoId,
  {
    showBrandName: true,
    textTransform: 'uppercase',
    invertLogo: false,
    logoContrast: 100,
  }
);

// Add critique
await logoService.updateLogoCritique(userId, brandId, logoId, critique);

// Add rating and feedback
await logoService.updateLogoRating(userId, brandId, logoId, 5, 'Great logo!');

// Get logos query
const logosQuery = logoService.getLogosQuery(userId, brandId);

// Delete logo
await logoService.deleteLogo(userId, brandId, logoId);
```

### 2. Auth Guard Pattern

The `useRequireAuth` hook standardizes authentication checks and automatic redirects.

**Location**: `src/features/auth/hooks/use-require-auth.tsx`

```typescript
import { useRequireAuth } from '@/features/auth/hooks';

function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();
  // Automatically redirects to home if not authenticated

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // At this point, user is guaranteed to be authenticated
  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

**Benefits**:
- Eliminates repetitive `useEffect` patterns
- Consistent behavior across all protected routes
- Single source of truth for auth requirements
- Cleaner component code

### 3. Component Extraction

The brand detail page has been extensively refactored with numerous extracted components for better maintainability.

#### Key Components

**BrandHeader** (`src/features/brands/components/brand-header.tsx`)
- Displays brand name, elevator pitch, target audience, and visual cues

**BrandIdentityCard** (`src/features/brands/components/brand-identity-card.tsx` - 666 lines)
- Manages logo display, colorization, hue shifting, and logo pagination
- Handles logo generation with multiple AI providers
- Display settings (show brand name, text transform, invert, contrast)
- Sticker and mockup previews

**LogoShowcase** (`src/features/brands/components/logo-showcase.tsx` - 51k+ characters)
- Advanced logo display with SVG rendering
- Horizontal and vertical layout support
- Font selection and customization
- Real-time cropping and adjustments
- Export to various formats

**TaglinesList** (`src/features/brands/components/taglines-list.tsx`)
- Displays taglines with like/dislike actions
- Generate new taglines button
- Loading and empty states

**BrandApplications** (`src/features/brands/components/brand-applications.tsx`)
- Shows logo applied to various mockups (business cards, t-shirts, etc.)
- Multiple mockup templates

**LogoControls** (`src/features/brands/components/logo-controls.tsx`)
- UI controls for logo display settings
- Layout toggles, text transforms, invert, contrast

**CritiquePoint** (`src/features/brands/components/critique-point.tsx`)
- Visual annotation component for logo critiques
- Shows positive/negative feedback points with coordinates

### 4. Multi-Provider AI System

The application supports multiple AI providers for different tasks:

**Logo Generation Providers**:
1. **Google Imagen** (generate-logo.ts) - Default provider
2. **OpenAI DALL-E 3** (generate-logo-openai.ts) - High quality, various sizes
3. **Fal.ai Flux** (generate-logo-fal.ts) - Fast generation, multiple models

**Provider Selection**:
- Each provider has specific strengths
- Unified interface through server actions
- Prompt engineering specific to each provider

### 5. Font System

**Location**: `src/config/brand-fonts.ts`

- 27 Google Fonts categorized by style (Formal, Rounded, Stylish, Cute, Modern)
- Each font includes multiple weights
- Size multipliers for visual balance
- Consistent font selection based on brand ID
- Random font selection by category

```typescript
import { getBrandFontStyle, getRandomFontByCategory } from '@/config/brand-fonts';

// Get consistent font for a brand
const { fontFamily, fontWeight } = getBrandFontStyle(brandId, 'Modern');

// Get random font from category
const font = getRandomFontByCategory('Stylish');
```

## Data Models

### Brand

**Location**: `src/lib/types.ts`

```typescript
interface Brand {
  id: string;                      // Document ID
  userId: string;                  // Owner's user ID
  createdAt: FirestoreTimestamp;   // Firestore Timestamp
  latestName: string;              // Brand name
  latestElevatorPitch: string;     // Brand description
  latestAudience: string;          // Target audience
  latestDesirableCues: string;     // Desired visual cues
  latestUndesirableCues: string;   // Undesired visual cues
  latestConcept?: string;          // AI-generated logo concept
  logoUrl?: string;                // Current logo URL
  primaryTagline?: string;         // Selected tagline
  font?: string;                   // Selected font name
  displaySettings?: Logo['displaySettings']; // Logo display settings
}
```

### Tagline

```typescript
interface Tagline {
  id: string;
  brandId: string;
  userId: string;
  tagline: string;
  createdAt: FirestoreTimestamp;
  status?: 'generated' | 'liked' | 'disliked';
}
```

### Logo

```typescript
interface Logo {
  id: string;
  brandId: string;
  userId: string;
  logoUrl: string;                 // Original logo URL
  prompt?: string;                 // Generation prompt
  concept?: string;                // Logo concept description
  createdAt: FirestoreTimestamp;
  isPublic?: boolean;              // Public sharing enabled

  // Display settings
  displaySettings?: {
    textTransform: 'none' | 'lowercase' | 'capitalize' | 'uppercase';
    showBrandName: boolean;
    invertLogo: boolean;
    logoContrast: number;
    horizontalLogoTextGap?: number;
    horizontalLogoTextBalance?: number;
    verticalLogoTextGap?: number;
    verticalLogoTextBalance?: number;
  };

  // Color versions (deprecated single version, now array)
  colorLogoUrl?: string;           // Deprecated
  palette?: string[];              // Deprecated
  colorNames?: string[];           // Deprecated
  colorVersions?: Array<{          // New: multiple color versions
    colorLogoUrl: string;
    palette: string[];
    colorNames?: string[];
  }>;

  // AI critique and feedback
  critique?: Critique;
  critiqueFeedback?: Record<string, 'agree' | 'disagree'>;

  // Additional metadata
  externalMediaUrl?: string;       // Original uploaded image
  vectorLogoUrl?: string;          // Vectorized version
  isDeleted?: boolean;             // Soft delete flag
  cropDetails?: {                  // Cropping information
    x: number;
    y: number;
    width: number;
    height: number;
  };
  font?: string;                   // Selected font
  rating?: number;                 // 1-5 star ranking
  feedback?: string;               // Qualitative feedback
  presentationData?: PresentationData;
  justification?: Justification;
}
```

### Critique

```typescript
interface CritiquePoint {
  id: string;
  x: number;                       // X coordinate percentage (0-100)
  y: number;                       // Y coordinate percentage (0-100)
  comment: string;
  sentiment: 'positive' | 'negative';
}

interface Critique {
  overallSummary: string;
  points: CritiquePoint[];         // Visual annotation points
}
```

### LogoFeedback

```typescript
interface LogoFeedback {
  id: string;
  logoId: string;
  brandId: string;
  rating: number;                  // 1-5 stars
  comment: string;
  authorName?: string;             // Present if user was logged in
  authorId?: string;               // Present if user was logged in
  isAnonymous: boolean;
  createdAt: FirestoreTimestamp;
}
```

### Firestore Structure

```
/users/{userId}
  └── /brands/{brandId}
      ├── /inputVersions/{versionId}        (future use)
      ├── /taglineGenerations/{generationId}
      └── /logoGenerations/{generationId}
```

## Security Model

### Firestore Security Rules

**Location**: `firestore.rules`

The application uses a strict user-ownership model:

1. **All data nested under `/users/{userId}`**
   - No cross-user data access
   - User listing is disabled for privacy

2. **Only authenticated users can access their own data**
   - Helper functions: `isSignedIn()`, `isOwner(userId)`, `isExistingOwner(userId)`

3. **`userId` field denormalized across all documents**
   - Enables efficient authorization checks
   - No need for extra `get()` calls in security rules

## Firebase Integration

### Custom Hooks

**All hooks exported from**: `src/firebase/index.ts`

- **`useFirebase()`** - Access all Firebase services and user state
- **`useAuth()`** - Firebase Auth instance
- **`useFirestore()`** - Firestore instance
- **`useStorage()`** - Firebase Storage instance
- **`useUser()`** - User authentication state (user, isUserLoading, userError)
- **`useCollection<T>(query)`** - Real-time Firestore collection listener
- **`useDoc<T>(docRef)`** - Real-time Firestore document listener
- **`useMemoFirebase<T>(factory, deps)`** - Memoized Firebase objects (queries, refs)

## AI Flows (Genkit)

All AI flows are located in `src/ai/flows/` and use Google Genkit with structured outputs (Zod schemas).

### 1. Generate Brand Details

**File**: `src/ai/flows/generate-brand-details.ts`

- **Input**: `{ topic: string }`
- **Output**: `{ name, elevatorPitch, audience, desirableCues, undesirableCues }`
- **Usage**: "Fill for me" button on brand creation form
- **Model**: Google Generative AI

### 2. Complete Brand Details

**File**: `src/ai/flows/complete-brand-details.ts`

- **Input**: Partial brand details
- **Output**: Complete brand details with missing fields filled
- **Usage**: Smart completion of partially filled forms

### 3. Generate Logo Concept

**File**: `src/ai/flows/generate-logo-concept.ts`

- **Input**: Brand details
- **Output**: `{ concept: string }` - Detailed logo concept description
- **Usage**: Pre-generation step to create better prompts

### 4. Generate Logo (Multiple Providers)

**Files**:
- `generate-logo.ts` (Google Imagen)
- `generate-logo-openai.ts` (DALL-E 3)
- `generate-logo-fal.ts` (Fal.ai Flux)

- **Input**: `{ name, elevatorPitch, audience, desirableCues, undesirableCues, concept? }`
- **Output**: `{ logoUrl: string, prompt: string }` (data URI + prompt used)
- **Post-processing**: Data URI uploaded to Cloudflare R2 or Firebase Storage
- **Models**: Google Imagen / OpenAI DALL-E 3 / Fal.ai Flux

### 5. Colorize Logo

**File**: `src/ai/flows/colorize-logo.ts`

- **Input**: `{ logoUrl, name, elevatorPitch, audience, desirableCues, undesirableCues }`
- **Output**: `{ colorLogoUrl: string, palette: string[], colorNames?: string[] }`
- **Pre-processing**: Storage URL converted to data URI
- **Post-processing**: Colorized logo uploaded to storage
- **Model**: Google Generative AI

### 6. Critique Logo

**File**: `src/ai/flows/critique-logo.ts`

- **Input**: `{ logoUrl, brandName, elevatorPitch, audience, desirableCues, undesirableCues }`
- **Output**: `{ overallSummary: string, points: CritiquePoint[] }`
- **Usage**: Visual annotation of logo with positive/negative feedback
- **Model**: Google Generative AI with vision

### 7. Vectorise Logo

**File**: `src/ai/flows/vectorise-logo.ts`

- **Input**: Raster logo URL
- **Output**: Vector logo URL (SVG)
- **Usage**: Convert raster logos to scalable vector format

### 8. Generate Taglines

**File**: `src/ai/flows/generate-tagline.ts`

- **Input**: `{ name, elevatorPitch, audience, desirableCues?, undesirableCues? }`
- **Output**: `{ taglines: string[] }` (array of 3 taglines)
- **Model**: Google Generative AI

### 9. Generate Presentation Data

**File**: `src/ai/flows/generate-presentation-data.ts`

- **Input**: Brand details
- **Output**: Structured presentation slide data
- **Usage**: Create professional brand presentation slides

### 10. Justify Logo

**File**: `src/ai/flows/justify-logo.ts`

- **Input**: Logo and brand details
- **Output**: Design justification explaining logo choices
- **Usage**: Explain design decisions to clients

### 11. Generate Stories

**File**: `src/ai/flows/generate-stories.ts`

- **Input**: Brand details
- **Output**: Brand storytelling content
- **Usage**: Create compelling brand narratives

## Server Actions

**Location**: `src/app/actions.ts`

All server actions for AI operations with consistent error handling.

### Key Server Actions

- `getTaglineSuggestions()` - Generate taglines
- `getLogoSuggestion()` - Generate logo (default provider)
- `getLogoSuggestionOpenAI()` - Generate logo with DALL-E
- `getLogoSuggestionFal()` - Generate logo with Fal.ai
- `getBrandSuggestions()` - Generate brand details from topic
- `convertUrlToDataUri()` - Convert storage URL to data URI
- `getColorizedLogo()` - Colorize existing logo
- `getCritiqueLogo()` - Get AI critique with visual annotations
- `getVectorisedLogo()` - Convert to vector format
- `generatePresentationData()` - Generate presentation slides

## Storage Strategy

### Cloudflare R2 (Primary)

**Files**: `src/lib/r2.ts`, `src/lib/r2-upload.ts`, `src/lib/r2-upload-client.ts`

- Primary storage for media assets
- Cost-effective and fast global delivery
- S3-compatible API
- Environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

### Firebase Storage (Legacy)

- Legacy support for existing assets
- Gradual migration to R2
- Used for backward compatibility

## New Features

### 1. Logo Detail Page

**Route**: `/brands/[brandId]/logos/[logoId]`

- Full-screen logo display
- Critique annotations
- Mockup previews
- Download options
- Sharing capabilities

### 2. Presentation Mode

**Route**: `/brands/[brandId]/presentation`

- Animated slide presentation of brand identity
- Professional layout with transitions
- Logo applications showcase
- Export to PDF/images

### 3. Start from Image

**Route**: `/start-from-image`

- Upload existing logo image
- Automatically extract colors
- Generate brand details from image
- Create complete brand identity

### 4. Logo Ranker

**Route**: `/ranker`

- Rate and review generated logos
- Provide qualitative feedback
- Improve AI prompts based on ratings
- Track logo quality over time

### 5. Moodboard

**Feature**: Integrated Unsplash image search
- Search and collect inspiration images
- Visual moodboard creation
- Color palette extraction from images

### 6. Advanced Logo Controls

- Horizontal/vertical layout toggle
- Text transform options (uppercase, lowercase, capitalize)
- Show/hide brand name
- Invert logo colors
- Contrast adjustment
- Font selection with live preview
- Precise cropping tools

## Scripts

```bash
# Development
npm run dev              # Start Next.js dev server with Turbopack
npm run genkit:dev       # Start Genkit development UI
npm run genkit:watch     # Start Genkit with watch mode

# Production
npm run build            # Production build (TypeScript & ESLint checks enabled)
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler check (tsc --noEmit)
npm test                 # Run Vitest test suite (117 tests)
npm run test:watch       # Run Vitest in watch mode
```

## Testing

**Test runner**: Vitest (configured in `vitest.config.ts`)

**Test files** (117 tests across 4 files):
- `src/lib/__tests__/color-utils.test.ts` — hex/rgb/hsl conversion, darken/lighten, shiftHue, isLightColor
- `src/lib/__tests__/logo-analysis.test.ts` — analyzeLogoImage, calculateBalance, balanceToDisplaySettings
- `src/lib/__tests__/image-utils.test.ts` — getProxyUrl
- `src/features/onboarding/utils/__tests__/validation-schemas.test.ts` — all onboarding Zod schemas

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push to main and every PR:
1. `npm run typecheck`
2. `npm run lint`
3. `npm test`

## Credits System

**Credits** gate AI generation actions. Each action has a cost defined in `src/lib/credits.ts`.

**Architecture:**
- Firestore path: `userProfiles/{userId}` (balance, totalPurchased, totalUsed)
- Transaction history: `userProfiles/{userId}/transactions/{id}`
- Service: `src/services/credits.service.ts` — `CreditsService` / `createCreditsService(firestore)`
- Hook: `src/hooks/use-credits.ts` — `useCredits()` returns `{ balance, isLoading, creditsService }`
- Constants: `src/lib/credits.ts` — `CREDIT_COSTS`, `CREDIT_PACKAGES`, `INITIAL_CREDITS`

**Credit costs:**
- Logo generation: 10 | Colorization: 5 | Vectorization: 5
- Critique: 3 | Concept: 3 | Tagline: 2
- Presentation narrative: 5 | Brand completion/suggestions: 3

**New users** get 50 free credits (initialized on first load via `useCredits` hook).

**Mock payment page** at `/credits` — buy 50/100/200 credits with a single click. Shows balance, cost table, and transaction history.

**Header** shows credit balance as a clickable pill linking to `/credits`.

**Integration points** (credit checks added):
- `brand-detail-client.tsx`: concept generation, logo generation, colorization, critique, vectorization
- `presentation-client.tsx`: narrative generation

## Error Handling

**Error Boundaries**: React error boundaries prevent individual component failures from crashing the entire page.

- `src/components/error-boundary.tsx` — Reusable `<ErrorBoundary section="Name">` component (class component). Catches render errors, reports to Sentry, shows fallback UI with "Try again" button.
- `src/app/global-error.tsx` — Catches errors in the root layout (required for `FirebaseErrorListener` throws)
- `src/app/error.tsx` — Root-level error page
- `src/app/not-found.tsx` — 404 page
- `src/app/dashboard/error.tsx` — Dashboard-specific error page
- `src/app/brands/[brandId]/error.tsx` — Brand editor error page
- `src/app/brands/[brandId]/presentation/error.tsx` — Presentation error page

**Where error boundaries are applied**:
- Brand editor: `BrandIdentityCard` wrapped in `<ErrorBoundary section="Brand Editor">`
- Dashboard: Each `BrandListItem` wrapped individually (one bad brand card won't crash the grid)
- Presentation: Each slide render + each PDF export slide wrapped individually

**Sentry** (`@sentry/nextjs`): Error tracking, activated by setting `NEXT_PUBLIC_SENTRY_DSN` env var.
- Config: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Instrumentation: `src/instrumentation.ts`
- Source map upload: enabled when `SENTRY_AUTH_TOKEN` is set

## MCP / API System

**4 API endpoints** for programmatic brand access, used by Claude Desktop and external integrations.

**Authentication**: API keys with format `colater_sk_brand_{brandId}_{random}`, validated via SHA-256 hash lookup in Firestore `collectionGroup('apiKeys')`. Supports 3 permission tiers: owner (full), team (read+validate), developer (read+generate).

**Auth module**: `src/lib/mcp-auth.ts` — `validateMCPApiKey()`, `requireMCPAuth()`

**Endpoints** (all POST, require `Authorization: Bearer <api-key>`):
- `/api/mcp/brands/context` — Full brand identity, voice, visual, positioning. Params: `brandId`, `sections?`, `includeAssets?`
- `/api/mcp/brands/list` — List brands with pagination/sorting/filtering. Params: `limit?`, `offset?`, `sortBy?`, `filter?`
- `/api/mcp/assets/get` — Logos, colors, fonts in multiple formats (hex/rgb/hsl/tailwind/css/figma). Params: `brandId`, `assetTypes`, `format?`
- `/api/mcp/voice/validate` — AI voice validation via Gemini. Params: `brandId`, `text`, `context?`, `strictness?`

**Settings page**: `/brands/[brandId]/settings` with 3 tabs:
- **Share & API Keys** (`brand-api-keys-tab.tsx`) — Create/list/revoke API keys, MCP config generator dialog
- **Integrations** (`brand-integrations-tab.tsx`) — MCP setup wizard (3-step Claude Desktop config), interactive API playground (test endpoints live with session auth), code snippets (cURL/TypeScript/Python), quick reference table
- **General** — Coming soon

**Discoverability**: Settings button in `brand-identity-header.tsx` links to `/brands/[brandId]/settings?tab=integrations`. Tab query param respected via `useSearchParams()`.

**API key service**: `src/services/api-key.service.ts` — CRUD for brand API keys

## Studio (new brand flow)

Routes: `/studio/new` (name + one sentence + Jev-suggested preset tags) → `/studio/[brandId]` (rounds of 3 directions as rows).
Server actions: `src/app/studio/actions.ts` (`suggestTags`, `createStudioBrand`, `startRound`, `pickDirection`). Background work runs in `after()` via `src/ai/studio/run-round.ts`.
Data: `users/{uid}/brands/{brandId}/{rounds,directions}` (server-written only), `events` (server-only).
Credits: server-only via `src/lib/server-credits.ts` (idempotent charge keys, refunds). Round = 15, failed direction refunds 5. Legacy pages charge through `spendCredits` in `src/app/actions/credits.ts`.
Models: `src/ai/logo-models.ts` (Recraft V4.1, GPT Image 1.5, Nano Banana Pro). Jev (`typesafe-ai/jev`) via `AI_GATEWAY_API_KEY` for tag suggestions and font choice.
Local: `npm run emulators` (needs Java: `PATH="/opt/homebrew/opt/openjdk/bin:$PATH"`) + `npm run dev:local` (port of your choice, builds into `.next-local`); emulator tests `npm run test:emulator`. Test login: `scripts/emulator-test-user.json`.
Phase 4: each row shows mark, lockup, laptop sticker, app icon, and brand-written typography (free), plus dashed placeholders generated via `generateSlide` (voice 2, vector 5; mark redo 5; lockup/typography font change and color re-pick free) through `src/ai/studio/request-slide.ts` + `run-slide.ts`. Palettes: 256 named palettes in 8 mood groups of 32 (`src/config/palettes.ts`, contrast-checked via `src/lib/contrast.ts`). `src/ai/studio/palette-picker.ts` has Jev pick a group then a palette at generation time (random fallback); a palette already used on the page gets jittered shades. The direction stores `paletteName` + `slides.color`; mark and lockup slides show the mark in primary and the name in ink on the background (exact browser recolor, `src/lib/recolor.ts`). Color feedback re-picks a different palette, keeping the old one on screen while pending. Slides shimmer while loading and drop into their slot when ready, staggered when several land together (`src/features/studio/reveal-stagger.ts`). Per-slide feedback chips live in `SLIDE_FEEDBACK_CHIPS`. A failed mark redo keeps the old mark (`redoError`). The sweep also refunds slides/redos stuck >10 min.
Local dev gotcha: start Next with a high file limit (`ulimit -n 10240`). Launched with macOS's default soft limit (256) the dev server runs out of descriptors and outbound AI/fal calls stall until they time out.
Design: `docs/superpowers/specs/2026-10-11-studio-brand-flow-design.md`; plan: `docs/superpowers/plans/2026-10-11-studio-phases-1-3.md`.

## Environment Variables

**Required in `.env`**:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server actions, API routes): service-account JSON from the console
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Anthropic (all text AI via Genkit; required at import time)
ANTHROPIC_API_KEY=...

# Vercel AI Gateway (Jev decision model: Studio tag suggestions + font choice)
AI_GATEWAY_API_KEY=...

# Fal.ai (all image models)
FAL_KEY=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...

# Unsplash (optional, for moodboard)
UNSPLASH_ACCESS_KEY=...

# Sentry (optional, for error tracking)
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...  # Only needed for source map upload
```

## UI Components (shadcn/ui)

Using shadcn/ui with Radix UI primitives (40+ components):

**Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider, Pill Input
**Feedback**: Toast, Dialog, Alert Dialog, Alert, Popover, Tooltip
**Layout**: Card, Tabs, Accordion, Separator, Collapsible, Scroll Area
**Navigation**: Button, Dropdown Menu, Menubar, Sidebar
**Data Display**: Table, Avatar, Badge, Progress, Skeleton
**Advanced**: Chart (Recharts), Calendar (react-day-picker), Carousel (Embla)

**Component Configuration**: `components.json`

## Design Philosophy

- **Primary color**: Soft lavender (#D1C4E9) - creativity and clarity
- **Background**: Light gray (#F5F5F5) - clean canvas
- **Accent**: Muted teal (#80CBC4) - interactive elements
- **Font**: Multiple Google Fonts with categorization
- **Layout**: Minimalist with clear card-based structure
- **Animations**: Smooth transitions with Framer Motion
- **Interactions**: Hover states, responsive design, micro-interactions

## Performance Optimizations

1. **Memoization**:
   - Firebase queries memoized with `useMemoFirebase`
   - Service instances memoized with `useMemo`
   - Computed values memoized with `useMemo`
   - Expensive component renders prevented with `React.memo`

2. **Real-time Subscriptions**:
   - Automatic cleanup on unmount
   - Optimized re-renders with context memoization

3. **Image Optimization**:
   - Next.js Image component with automatic optimization
   - Remote patterns configured for CDNs
   - Lazy loading for off-screen images
   - Cloudflare R2 for global CDN delivery

4. **Code Splitting**:
   - App Router automatic code splitting
   - Dynamic imports for heavy components
   - Route-based code splitting

5. **Turbopack**:
   - Fast refresh in development
   - Optimized builds
   - Hot module replacement

6. **Client-Server Separation**:
   - Server components for static content
   - Client components only where needed
   - Reduced JavaScript bundle size

## Known Considerations

- User state loading must complete before redirecting
- Google Sign-in uses redirect flow (not popup) for reliability
- Data URIs converted to Storage URLs for persistence and performance
- Logo images explicitly set as PNG MIME type
- Firestore queries memoized to prevent unnecessary re-subscriptions
- Color hue shifting applied via CSS filter (client-side)
- Firestore serverTimestamp() used for consistent timestamps
- Multiple AI providers require different API keys
- R2 storage requires S3-compatible SDK setup
- Font loading managed through Next.js font optimization

## Development Tips

1. **Use the service layer** for all Firestore operations
2. **Use `useRequireAuth`** for all protected routes
3. **Memoize Firebase objects** with `useMemoFirebase`
4. **Extract large components** into smaller, focused ones
5. **Run type checks** before committing: `npm run typecheck`
6. **Run linter** before committing: `npm run lint`
7. **Use the Genkit Dev UI** for testing AI flows: `npm run genkit:dev`
8. **Test with multiple AI providers** to ensure consistent behavior
9. **Use client components sparingly** - prefer server components
10. **Test responsive design** at multiple breakpoints

## Testing Strategy

**Currently tested** (117 tests, all passing):
- Color conversion utilities (hex/rgb/hsl roundtrips, darken/lighten/shiftHue)
- Logo analysis algorithms (visual weight, balance calculation, display settings)
- Image proxy URL generation
- Onboarding validation schemas (all 4 steps + merged schema)

**Recommended next areas to add tests**:
- Service layer methods (brand.service, logo.service, tagline.service) with mocked Firestore
- API routes (api-key CRUD, image search)
- AI flow contract tests (validate response shapes, not AI output content)

## Contributing

When contributing to this codebase:

1. **Follow the architecture**: Use service layer, extract components, use hooks
2. **Type everything**: No `any` types without good reason
3. **Memoize Firebase objects**: Use `useMemoFirebase` for queries and refs
4. **Run checks**: `npm run typecheck && npm run lint`
5. **Update documentation**: Keep CLAUDE.md in sync with changes
6. **Write tests**: Add tests for new features
7. **Consider performance**: Optimize images, minimize client components
8. **Multi-provider support**: Ensure new AI features work with all providers

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Genkit Documentation](https://firebase.google.com/docs/genkit)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Fal.ai Documentation](https://fal.ai/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## Support

For issues, bugs, or questions:
- Review this documentation for implementation details
- Check the codebase structure for architectural patterns
- Test with different AI providers to isolate issues
