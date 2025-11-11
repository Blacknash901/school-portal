# Components Structure

This directory contains all React components for the School Portal application, organized by functionality.

## 📂 Directory Structure

```
components/
├── README.md                   # This file
├── Content.js                  # Main content wrapper (auth check)
├── ErrorBoundary.js            # Error boundary for app
│
├── app/                        # Application cards
│   ├── AppCard.js             # Individual app card component
│   └── AppCard.test.js        # App card tests
│
├── debug/                      # Debugging components
│   └── S3LoggingDebug.js      # S3 logging debug panel
│
├── login/                      # Authentication components
│   ├── LoginButton.js         # Main login button
│   ├── MicrosoftSignInButton.js  # Microsoft auth button
│   └── GoogleSignInButton.js  # Google auth button
│
├── news/                       # News feed components
│   ├── UnifiedNews.js         # Static news cards
│   └── WordPressNews.js       # WordPress RSS feed
│
├── portal/                     # User portal components
│   ├── UserPortal.js          # Main portal container
│   ├── UserPortal.css         # Portal styles
│   ├── UserMenu.js            # User dropdown menu
│   └── LogoutButton.js        # Logout functionality
│
└── ui/                         # Reusable UI components
    ├── LoadingSpinner.js      # Loading spinner
    ├── LoadingSpinner.css     # Spinner styles
    ├── LoadingSpinner.test.js # Spinner tests
    ├── ErrorMessage.js        # Error display
    ├── ErrorMessage.css       # Error styles
    ├── ErrorMessage.test.js   # Error tests
    ├── SkeletonLoader.js      # Loading placeholders
    └── SkeletonLoader.css     # Skeleton styles
```

---

## 🎯 Component Categories

### Root Level Components

**Content.js**

- Main content wrapper
- Handles authentication checks
- Routes to portal or login

**ErrorBoundary.js**

- Catches React errors
- Provides fallback UI
- Download logs functionality

---

### app/ - Application Components

**Purpose:** Display application cards in the portal

**AppCard.js**

- Renders individual app cards
- Handles click logging
- Supports images or emoji icons
- Sanitizes URLs

**Usage:**

```javascript
import AppCard from "./app/AppCard";

<AppCard
  app={{
    id: "teams",
    name: "Microsoft Teams",
    url: "https://teams.microsoft.com",
    icon: "💬",
    color: "#4B53BC",
  }}
/>;
```

---

### debug/ - Debugging Components

**Purpose:** Development and debugging tools

**S3LoggingDebug.js**

- Debug panel for S3 logging
- Test logging functionality
- View log status

---

### login/ - Authentication Components

**Purpose:** Handle user authentication

**LoginButton.js**

- Main login interface
- Shows Microsoft and Google options
- Handles auth redirects

**MicrosoftSignInButton.js**

- Microsoft/Azure AD authentication
- MSAL integration
- Group retrieval

**GoogleSignInButton.js**

- Google OAuth authentication
- Google API integration

**Usage:**

```javascript
import LoginButton from "./login/LoginButton";

<LoginButton />;
```

---

### news/ - News Components

**Purpose:** Display news and devotionals

**UnifiedNews.js**

- Static news cards
- Colorful pastel palette (light mode)
- Muted colors (dark mode)
- No API calls

**WordPressNews.js**

- Fetches WordPress RSS feed
- Displays devotionals
- Loading states with skeletons
- Error handling with retry
- Hover to expand

**Usage:**

```javascript
import UnifiedNews from "./news/UnifiedNews";
import WordPressNews from "./news/WordPressNews";

<UnifiedNews theme={theme} />
<WordPressNews
  feedUrl="https://devocecre.wordpress.com/feed"
  maxItems={2}
  theme={theme}
/>
```

---

### portal/ - User Portal Components

**Purpose:** Main portal interface after login

**UserPortal.js**

- Main portal container
- Shows apps based on role
- Displays news sections
- Theme management
- Group-based role detection

**UserMenu.js**

- User dropdown menu
- Profile info
- Theme toggle
- Logout option

**LogoutButton.js**

- Handle logout
- Multiple logout strategies
- Logging

**Usage:**

```javascript
import UserPortal from "./portal/UserPortal";

<UserPortal />;
```

---

### ui/ - Reusable UI Components

**Purpose:** Shared UI components used throughout the app

**LoadingSpinner**

- Animated loading spinner
- 3 sizes: small, medium, large
- Customizable message
- Theme-aware

**Usage:**

```javascript
import LoadingSpinner from "./ui/LoadingSpinner";

<LoadingSpinner size="medium" message="Cargando..." />;
```

**ErrorMessage**

- User-friendly error display
- 3 variants: error, warning, info
- Optional retry button
- Icons for visual feedback

**Usage:**

```javascript
import ErrorMessage from "./ui/ErrorMessage";

<ErrorMessage
  title="Error al cargar"
  message="No se pudo conectar al servidor"
  onRetry={handleRetry}
  variant="error"
/>;
```

**SkeletonLoader**

- Loading placeholders
- Shimmer animation
- NewsCardSkeleton and AppCardSkeleton

**Usage:**

```javascript
import { NewsCardSkeleton } from "./ui/SkeletonLoader";

{
  loading && <NewsCardSkeleton />;
}
```

---

## 🔗 Import Paths

### From other components:

```javascript
// From a component in the same folder
import UserMenu from "./UserMenu";

// From a component in a sibling folder
import LoadingSpinner from "../ui/LoadingSpinner";
import AppCard from "../app/AppCard";

// From a parent folder component
import Content from "../Content";

// From utils/data (up two levels)
import { logEvent } from "../../utils/logger";
import { getAppsForRole } from "../../data/apps";
```

### From App.js or other root files:

```javascript
import Content from "./components/Content";
import ErrorBoundary from "./components/ErrorBoundary";
import UserPortal from "./components/portal/UserPortal";
```

---

## 🧪 Testing

Tests are co-located with their components:

```
ui/
├── LoadingSpinner.js
├── LoadingSpinner.test.js    # Tests for LoadingSpinner
├── ErrorMessage.js
└── ErrorMessage.test.js      # Tests for ErrorMessage
```

**Run tests:**

```bash
npm test
npm test -- --watch
npm test -- LoadingSpinner.test.js
```

---

## 📝 Adding New Components

### 1. Choose the right folder:

- **app/** - App-related display components
- **debug/** - Debugging/development tools
- **login/** - Authentication components
- **news/** - News/feed components
- **portal/** - Main portal interface components
- **ui/** - Reusable UI components
- **Root** - Only for top-level wrappers

### 2. Create your component:

```javascript
// src/components/ui/MyComponent.js
import React from "react";
import "./MyComponent.css";

export default function MyComponent({ prop1, prop2 }) {
  return <div className="my-component">{/* Component content */}</div>;
}
```

### 3. Add tests:

```javascript
// src/components/ui/MyComponent.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent prop1="test" />);
    expect(screen.getByText("test")).toBeInTheDocument();
  });
});
```

### 4. Import correctly:

```javascript
// From another component in ui/
import MyComponent from "./MyComponent";

// From a component in another folder
import MyComponent from "../ui/MyComponent";

// From outside components/
import MyComponent from "./components/ui/MyComponent";
```

---

## 🎨 Styling Guidelines

### CSS Files

- Co-locate with component: `ComponentName.css`
- Use CSS modules or scoped classes
- Theme-aware using CSS variables

### Theme Variables

```css
/* Use these in your components */
--bg: Background color
--card-bg: Card background
--text: Text color
--muted: Muted text
--accent: Accent color
--card-border: Card border color
--shadow: Shadow color
```

### Example:

```css
.my-component {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--card-border);
}
```

---

## 🔄 Component Communication

### Props (Preferred)

```javascript
<ChildComponent data={data} onAction={handleAction} />
```

### Context (For Global State)

```javascript
import { useMsal } from "@azure/msal-react";
const { accounts } = useMsal();
```

### Custom Hooks

```javascript
// In utils/
export function useTheme() {
  const [theme, setTheme] = useState("light");
  // ...
  return { theme, setTheme };
}
```

---

## 🐛 Debugging Components

### Using React DevTools

1. Install React DevTools browser extension
2. Open browser DevTools
3. Click "Components" tab
4. Inspect component props and state

### Using Debug Component

```javascript
import S3LoggingDebug from "./debug/S3LoggingDebug";

// Add temporarily for debugging
<S3LoggingDebug />;
```

### Console Logging

```javascript
import { logEvent, LOG_TYPES } from "../../utils/logger";

logEvent(LOG_TYPES.APP, "Component mounted", { componentName: "MyComponent" });
```

---

## 📚 Related Documentation

- **[Testing Guide](../../docs/guides/TESTING-GUIDE.md)** - How to write tests
- **[Visual Examples](../../docs/reference/VISUAL-EXAMPLES.md)** - Component usage examples
- **[Main README](../../README.md)** - Project overview

---

## ✅ Best Practices

1. **Keep components focused** - One responsibility per component
2. **Use prop-types or TypeScript** - Document expected props
3. **Write tests** - At least for complex logic
4. **Follow naming conventions** - PascalCase for components
5. **Co-locate related files** - .js, .css, .test.js together
6. **Use semantic HTML** - Accessible markup
7. **Handle loading/error states** - Better UX
8. **Make components reusable** - DRY principle
9. **Document complex logic** - Comments for "why", not "what"
10. **Keep imports organized** - React, libraries, local

---

**Last Updated:** October 26, 2025  
**Maintained By:** Dev Team
