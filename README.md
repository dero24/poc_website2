# Morphic Web

> **Instant AI-Powered React Apps** - Describe any idea, get a fully functional, beautiful React application in seconds using Groq's advanced AI models.

## ✨ Overview

Morphic Web revolutionizes app development by leveraging Groq's lightning-fast AI inference to transform natural language descriptions into production-ready React applications. Built with modern web technologies, it delivers instant, interactive previews without any build steps or npm dependencies.

## 🚀 Key Features

### AI-Powered Generation
- **One-Click Creation**: Enter any app concept in plain English
- **Intelligent Implementation**: Groq analyzes requirements and generates complete, runnable React code
- **Smart Context Injection**: Detailed prompt engineering ensures high-quality, consistent output

### Live Preview System
- **Instant Rendering**: Browser-based Babel transpilation with CDN script injection
- **Zero Dependencies**: All packages loaded via HTTPS CDNs (React, Tailwind, Lucide, etc.)
- **Error-Resistant**: Graceful fallbacks for any unsupported libraries or features

### Code Quality & Security
- **Production-Ready**: Generated code includes proper error handling, responsive design, and accessibility
- **Secure AI Integration**: API keys passed safely to generated apps via browser session variables
- **Template System**: Multiple prompt templates for different app styles and complexity levels

### Developer Experience
- **Version History**: Save, restore, and compare generated apps
- **Code Viewer**: Inspect and copy generated source code
- **Timeline Insights**: Track AI reasoning and generation steps

## 🔄 User Flow

### 1. Setup
- **API Key Entry**: Securely input your Groq API key (stored locally in browser)
- **Model Selection**: Choose from available Groq models for optimal performance

### 2. App Generation
- **Idea Input**: Describe your app concept (e.g., "A weather dashboard with interactive maps and 7-day forecasts")
- **AI Processing**: Single API call to Groq with injected context and guardrails
- **Instant Preview**: Live rendering in browser iframe with Babel transpilation

### 3. Iteration
- **Refine & Regenerate**: Modify description and generate new versions
- **Version Management**: Compare and select preferred implementations
- **Code Export**: Download or copy generated React code

### 4. Deployment
- **Browser-Ready**: Generated apps run directly in any modern browser
- **AI Integration**: Apps automatically access Groq API through injected session variables

## 🎨 Technical Architecture

### Core Technologies
- **Frontend**: React 18 with hooks, Tailwind CSS for styling, Lucide for icons
- **AI Engine**: Groq API for natural language processing and code generation
- **Preview System**: Browser Babel Standalone for JSX transpilation and runtime execution

### Generation Process
1. **Prompt Engineering**: User input combined with detailed templates and guardrails
2. **AI Inference**: Single Groq API call processes natural language → React code
3. **Code Sanitization**: Automatic validation and cleanup of generated output
4. **Runtime Injection**: CDN packages loaded dynamically for preview rendering

### Security & Performance
- **Client-Side Processing**: All generation happens in browser, API keys never leave client
- **CDN Optimization**: Minimal bundle size with external package loading
- **Error Boundaries**: Comprehensive error handling prevents crashes

## 🔑 AI Integration & API Key Handling

Morphic Web enables generated apps to use AI capabilities securely:

### Smart API Key Passing
Generated apps access the Groq API through a browser session variable:
```javascript
// Apps reference the stored API key like this:
const apiKey = window.__MORPHIC_GROQ_KEY__;

// This allows AI features in generated apps to work seamlessly
// without exposing keys or requiring user input
```

### Context-Aware Generation
- **Session Persistence**: API key stored locally, survives page refreshes
- **Dynamic Injection**: Generated code automatically includes key access patterns
- **Security First**: Keys never transmitted to external servers or logged

### Prompt Engineering
The single API call to Groq includes:
- **User Description**: Natural language app requirements
- **Technical Context**: React 18, CDN-only dependencies, browser compatibility
- **Security Rules**: No npm packages, safe API usage, error handling requirements
- **Output Format**: Clean JSX with default export and proper structure

## 📱 User Experience Highlights

### Intuitive Interface
- **Dark Theme**: Modern, eye-friendly design with glassmorphism effects
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Loading States**: Clear feedback during AI processing and preview loading

### Seamless Workflow
- **Zero Configuration**: Works immediately after API key setup
- **Instant Feedback**: See results within seconds of submission
- **Flexible Iteration**: Easy to experiment with different descriptions

### Developer-Friendly
- **Code Transparency**: View and understand generated implementations
- **Export Options**: Take generated code to any React project
- **Version Control**: Built-in history management for iterative development

## 🛠 Installation & Usage

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Groq API key (get one at [console.groq.com](https://console.groq.com))


## 🎯 Best Practices

### Writing App Descriptions
- **Be Specific**: "Weather app with maps" vs "Interactive weather dashboard with animated forecasts"
- **Include Features**: Mention desired interactions, data sources, and visual elements
- **Specify AI Needs**: If the app needs AI features, describe them clearly

### Model Selection
- **Speed**: Use smaller models for quick prototyping
- **Quality**: Larger models for complex, feature-rich applications
- **Cost**: Balance performance needs with API usage costs

### Code Generation
- **Review Output**: Always check generated code before production use
- **Test Features**: Verify AI integrations work as expected
- **Customize**: Use generated code as a starting point for further development

## 🔒 Security & Privacy

- **Local Processing**: All sensitive operations happen client-side
- **Key Storage**: API keys stored only in browser localStorage
- **No Data Transmission**: User code and keys never sent to external servers
- **CDN Security**: All external scripts loaded over HTTPS from trusted sources

## 🚀 Future Enhancements

- Real-time collaboration features
- Custom component library integration
- Advanced AI model fine-tuning
- Cloud deployment integration
- Plugin system for extended capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq Team** for providing blazing-fast AI inference
- **React Community** for the incredible framework ecosystem
- **Tailwind CSS** for utility-first styling excellence
- **Open Source Community** for the tools that make this possible

---

**Built with ❤️ using Groq AI and modern web technologies**

## 🧾 Changelog (Preview Runtime Overhaul)

- **Dynamic Preview Runtime**: Added `src/lib/previewRuntime.js` with `detectPackages()`, `transformAppCode()`, and `buildPreviewHTML()` to auto-inject CDNs and normalize imports to globals for reliable iframe previews.
- **LivePreview Update**: `src/components/LivePreview.jsx` now uses the runtime and includes a "Fix Preview (AI)" button that calls `groqService.generatePreviewManifestStrict()` (API-only, no MCP). On success, the manifest is persisted on the current version.
- **Manifest Prompt**: Added `src/prompts/previewManifestPrompts.js` to request a strict JSON manifest for ambiguous cases.
- **Version Persistence**: Extended `src/services/versionService.js` with `updateVersion(id, patch)` to store `previewManifest` per version and keep `currentApp` in sync.
- **Standalone Alignment**: `src/App.js` preview now delegates to the same runtime for consistency with `src/App.jsx`.
- **Dependency Cleanup**: Removed unused `react-split-pane` dependency to resolve React 18 peer conflicts before installation.
