# Cubi AI - UX/UI Design System & User Experience

## 🎨 **Design Philosophy & Principles**

### **Core Design Values**
- **Simplicity**: Clean, uncluttered interfaces that focus on content
- **Familiarity**: Leverage established patterns from ChatGPT and modern chat apps
- **Accessibility**: Inclusive design for all users
- **Efficiency**: Minimize cognitive load and maximize productivity
- **Consistency**: Unified design language across all touchpoints

### **Design Principles**
1. **User-Centric**: Design for user needs, not technical constraints
2. **Progressive Disclosure**: Show information when needed, hide complexity
3. **Responsive**: Adapt seamlessly across devices and screen sizes
4. **Performance-First**: Design for speed and responsiveness
5. **Accessibility-First**: Ensure usability for all users

---

## 🎯 **User Experience Flows**

### **Flow 1: First-Time User Onboarding**

#### **Step 1: Landing Page**
```
┌─────────────────────────────────────┐
│  Cubi AI Logo + Tagline             │
│  "Transform documents into          │
│   intelligent conversations"         │
│                                     │
│  [Get Started] [Learn More]         │
│                                     │
│  Features Preview:                   │
│  • Upload & Chat                    │
│  • Smart Analysis                   │
│  • Secure & Private                 │
└─────────────────────────────────────┘
```

#### **Step 2: Authentication**
```
┌─────────────────────────────────────┐
│  [Logo] Cubi AI                     │
│                                     │
│  Welcome back / Create account      │
│                                     │
│  Email: [________________]          │
│  Password: [________________]       │
│                                     │
│  [Sign In] [Create Account]         │
│                                     │
│  Or continue with:                  │
│  [Google] [GitHub]                  │
└─────────────────────────────────────┘
```

#### **Step 3: Welcome Experience**
```
┌─────────────────────────────────────┐
│  Welcome to Cubi AI! 🎉            │
│                                     │
│  Let's get you started:             │
│                                     │
│  [📁 Upload your first document]    │
│  [💬 Start a conversation]          │
│  [🎯 Take a tour]                   │
│                                     │
│  Quick Tips:                        │
│  • Upload PDF, DOCX, or TXT files   │
│  • Ask questions about your docs    │
│  • Get instant, intelligent answers │
└─────────────────────────────────────┘
```

### **Flow 2: Document Upload & Processing**

#### **Upload Methods**
```
┌─────────────────────────────────────┐
│  Upload Documents                   │
│                                     │
│  [📁 Browse Files]                  │
│  [📤 Drag & Drop Area]              │
│  [📋 Paste from Clipboard]          │
│                                     │
│  Supported formats:                 │
│  PDF, DOCX, DOC, TXT (up to 10MB)  │
│                                     │
│  [Upload] [Cancel]                  │
└─────────────────────────────────────┘
```

#### **Processing States**
```
┌─────────────────────────────────────┐
│  Processing document.pdf...         │
│                                     │
│  [██████████] 100%                  │
│                                     │
│  ✓ File uploaded                    │
│  ✓ Content extracted                │
│  ⏳ Generating embeddings...        │
│  ⏳ Ready for questions!            │
└─────────────────────────────────────┘
```

### **Flow 3: Chat Interaction**

#### **Empty State**
```
┌─────────────────────────────────────┐
│  [Logo] Cubi AI                     │
│                                     │
│  👋 Hello! I'm ready to help.       │
│                                     │
│  You can:                           │
│  • Ask me anything                  │
│  • Upload documents to chat about   │
│  • Get help with your work          │
│                                     │
│  Quick suggestions:                 │
│  [What can you do?]                 │
│  [Upload a document]                │
│  [Help me with research]            │
└─────────────────────────────────────┘
```

#### **Active Chat**
```
┌─────────────────────────────────────┐
│  [User Avatar] You                  │
│  Can you summarize this document?   │
│                                     │
│  [AI Avatar] Cubi AI                │
│  Here's a summary of your document: │
│                                     │
│  **Key Points:**                    │
│  • Point 1: Description...          │
│  • Point 2: Description...          │
│  • Point 3: Description...          │
│                                     │
│  [Copy] [Regenerate] [👍] [👎]      │
└─────────────────────────────────────┘
```

---

## 🎨 **Visual Design System**

### **Color Palette**

#### **Primary Colors**
```css
/* Brand Colors */
--cubi-primary: #10a37f;      /* OpenAI Green */
--cubi-primary-dark: #0d8a6f;
--cubi-primary-light: #1a7f64;

/* Neutral Colors */
--cubi-gray-50: #f9fafb;
--cubi-gray-100: #f3f4f6;
--cubi-gray-200: #e5e7eb;
--cubi-gray-300: #d1d5db;
--cubi-gray-400: #9ca3af;
--cubi-gray-500: #6b7280;
--cubi-gray-600: #4b5563;
--cubi-gray-700: #374151;
--cubi-gray-800: #1f2937;
--cubi-gray-900: #111827;
```

#### **Semantic Colors**
```css
/* Success */
--cubi-success: #10b981;
--cubi-success-light: #d1fae5;

/* Warning */
--cubi-warning: #f59e0b;
--cubi-warning-light: #fef3c7;

/* Error */
--cubi-error: #ef4444;
--cubi-error-light: #fee2e2;

/* Info */
--cubi-info: #3b82f6;
--cubi-info-light: #dbeafe;
```

### **Typography**

#### **Font Stack**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### **Type Scale**
```css
/* Headings */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

#### **Font Weights**
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### **Spacing System**

#### **Spacing Scale**
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### **Border Radius**
```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

### **Shadows**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

---

## 🧩 **Component Library**

### **Buttons**

#### **Primary Button**
```css
.btn-primary {
  background: var(--cubi-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--cubi-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### **Secondary Button**
```css
.btn-secondary {
  background: transparent;
  color: var(--cubi-gray-700);
  border: 1px solid var(--cubi-gray-300);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--cubi-gray-50);
  border-color: var(--cubi-gray-400);
}
```

#### **Icon Button**
```css
.btn-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--cubi-gray-100);
  transform: scale(1.05);
}
```

### **Input Fields**

#### **Text Input**
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--cubi-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--cubi-primary);
  box-shadow: 0 0 0 3px rgb(16 163 127 / 0.1);
}
```

#### **Textarea**
```css
.textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--cubi-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  resize: vertical;
  min-height: 2.5rem;
  max-height: 12rem;
  transition: all 0.2s;
}

.textarea:focus {
  outline: none;
  border-color: var(--cubi-primary);
  box-shadow: 0 0 0 3px rgb(16 163 127 / 0.1);
}
```

### **Cards**

#### **Message Card**
```css
.message-card {
  background: white;
  border: 1px solid var(--cubi-gray-200);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.message-card.user {
  background: var(--cubi-primary);
  color: white;
  margin-left: var(--space-16);
}

.message-card.ai {
  background: var(--cubi-gray-50);
  margin-right: var(--space-16);
}
```

#### **Document Card**
```css
.document-card {
  background: white;
  border: 1px solid var(--cubi-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all 0.2s;
  cursor: pointer;
}

.document-card:hover {
  border-color: var(--cubi-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### **Navigation**

#### **Sidebar**
```css
.sidebar {
  background: var(--cubi-gray-50);
  border-right: 1px solid var(--cubi-gray-200);
  transition: width 0.3s ease;
}

.sidebar.minimized {
  width: 4rem; /* 64px */
}

.sidebar.expanded {
  width: 16rem; /* 256px */
}
```

#### **Header**
```css
.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--cubi-gray-200);
  padding: var(--space-4) var(--space-6);
  position: sticky;
  top: 0;
  z-index: 50;
}
```

---

## 📱 **Responsive Design**

### **Breakpoints**
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### **Mobile-First Approach**

#### **Mobile Layout (< 768px)**
```
┌─────────────────────────────────────┐
│  [Menu] Cubi AI [Theme] [User]      │
├─────────────────────────────────────┤
│                                     │
│  Chat Messages                      │
│                                     │
│  [User Message]                     │
│  [AI Response]                      │
│                                     │
├─────────────────────────────────────┤
│  [📎] [Input Field] [Send]          │
└─────────────────────────────────────┘
```

#### **Tablet Layout (768px - 1024px)**
```
┌─────────┬───────────────────────────┐
│ [Logo]  │ Cubi AI [Theme] [User]    │
│ [New]   ├───────────────────────────┤
│ [Search]│                           │
│ [Hist]  │ Chat Messages             │
│ [Acc]   │                           │
│         │ [User Message]            │
│         │ [AI Response]             │
│         │                           │
│         ├───────────────────────────┤
│         │ [📎] [Input Field] [Send] │
└─────────┴───────────────────────────┘
```

#### **Desktop Layout (> 1024px)**
```
┌─────────┬───────────────────────────┐
│ [Logo]  │ Cubi AI [Theme] [User]    │
│ [New]   ├───────────────────────────┤
│ [Search]│                           │
│ [Hist]  │ Chat Messages             │
│         │                           │
│ [Acc]   │ [User Message]            │
│         │ [AI Response]             │
│         │                           │
│         ├───────────────────────────┤
│         │ [📎] [Input Field] [Send] │
└─────────┴───────────────────────────┘
```

---

## ♿ **Accessibility Guidelines**

### **WCAG 2.1 AA Compliance**

#### **Color Contrast**
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

#### **Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order throughout the interface

#### **Screen Reader Support**
- Semantic HTML structure
- Proper ARIA labels and descriptions
- Alternative text for images and icons
- Announcements for dynamic content changes

#### **Motion & Animation**
- Respect `prefers-reduced-motion` user preference
- Provide option to disable animations
- Ensure animations don't cause motion sickness

### **Accessibility Features**

#### **High Contrast Mode**
```css
@media (prefers-contrast: high) {
  :root {
    --cubi-primary: #006400;
    --cubi-gray-200: #000000;
    --cubi-gray-800: #ffffff;
  }
}
```

#### **Reduced Motion**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎭 **Micro-Interactions**

### **Loading States**

#### **Skeleton Loading**
```css
.skeleton {
  background: linear-gradient(90deg, 
    var(--cubi-gray-200) 25%, 
    var(--cubi-gray-100) 50%, 
    var(--cubi-gray-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### **Typing Indicator**
```css
.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
}

.typing-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--cubi-gray-400);
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-0.5rem); }
}
```

### **Hover Effects**

#### **Button Hover**
```css
.btn-hover {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-hover:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### **Card Hover**
```css
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

## 🎨 **Icon System**

### **Icon Specifications**
- **Size**: 20px x 20px (1.25rem)
- **Stroke Width**: 2px
- **Style**: Outlined/Line icons
- **Color**: Inherit from parent element

### **Icon Categories**

#### **Navigation Icons**
- `home`: Home/Dashboard
- `plus`: New Chat
- `search`: Search
- `clock`: History
- `user`: Account
- `settings`: Settings

#### **Action Icons**
- `upload`: File Upload
- `send`: Send Message
- `copy`: Copy
- `download`: Download
- `share`: Share
- `edit`: Edit

#### **Status Icons**
- `check`: Success
- `warning`: Warning
- `error`: Error
- `info`: Information
- `loading`: Loading

---

## 📊 **Data Visualization**

### **Progress Indicators**

#### **Linear Progress**
```css
.progress-linear {
  width: 100%;
  height: 0.25rem;
  background: var(--cubi-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-linear-bar {
  height: 100%;
  background: var(--cubi-primary);
  transition: width 0.3s ease;
}
```

#### **Circular Progress**
```css
.progress-circular {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--cubi-gray-200);
  border-top: 2px solid var(--cubi-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### **Charts & Graphs**
- **Bar Charts**: For document analysis statistics
- **Line Charts**: For usage trends over time
- **Pie Charts**: For document type distribution
- **Heatmaps**: For user activity patterns

---

## 🎯 **User Testing Scenarios**

### **Scenario 1: First-Time User**
**Objective**: Test onboarding flow and initial user experience

**Tasks**:
1. Create a new account
2. Upload a document
3. Ask a question about the document
4. Navigate the interface

**Success Criteria**:
- User completes all tasks within 5 minutes
- No more than 2 errors during the process
- User rates experience 4+ out of 5

### **Scenario 2: Power User**
**Objective**: Test advanced features and efficiency

**Tasks**:
1. Upload multiple documents
2. Search across documents
3. Export conversation
4. Use keyboard shortcuts

**Success Criteria**:
- User completes all tasks within 10 minutes
- User finds interface efficient and intuitive
- User would recommend to colleagues

### **Scenario 3: Accessibility Testing**
**Objective**: Ensure accessibility compliance

**Tasks**:
1. Navigate using only keyboard
2. Use screen reader to access all features
3. Test with high contrast mode
4. Test with reduced motion preferences

**Success Criteria**:
- All features accessible via keyboard
- Screen reader provides clear navigation
- High contrast mode works properly
- Reduced motion preferences respected

---

## 📋 **Design Deliverables**

### **Phase 1: Foundation**
- [ ] Design system documentation
- [ ] Component library
- [ ] Color palette and typography
- [ ] Icon set
- [ ] Basic layouts and wireframes

### **Phase 2: Core Features**
- [ ] Authentication flow designs
- [ ] Document upload interface
- [ ] Chat interface designs
- [ ] Sidebar navigation
- [ ] Responsive layouts

### **Phase 3: Advanced Features**
- [ ] Search interface
- [ ] Settings and preferences
- [ ] Export functionality
- [ ] Analytics dashboard
- [ ] Mobile app designs

### **Phase 4: Polish & Optimization**
- [ ] Micro-interactions
- [ ] Loading states
- [ ] Error states
- [ ] Success states
- [ ] Accessibility improvements

---

*Document created: December 2024*
*Version: 1.0*
*Last updated: Design planning phase*
