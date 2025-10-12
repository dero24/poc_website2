# Morphic Web - Revolutionary Instant App Creation

Transform natural language ideas into fully-working web applications in seconds using Groq's powerful LLMs.

## 🚀 Features

### Instant App Generation
- **Natural Language Input**: Describe your app idea in plain English
- **Immediate Results**: Get working React applications in seconds
- **Always Functional**: Guaranteed working output with intelligent fallbacks

### Groq-Powered AI
- **Model Selection**: Choose from multiple Groq models (Llama, Mixtral, Gemma)
- **Optimized Prompts**: Token-efficient templates for maximum performance
- **Elite Code Generation**: Professional-quality React code every time

### Advanced Capabilities
- **Live Preview**: Instant browser preview of generated apps
- **Code Viewer**: Syntax-highlighted code editor with Monaco
- **Version History**: Track and manage all your generated apps
- **Export/Import**: Download full projects or individual components

### Modern UI/UX
- **Beautiful Interface**: Glass-morphism design with smooth animations
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes with modern aesthetics

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Code Editor**: Monaco Editor
- **Icons**: Lucide React
- **AI Provider**: Groq API (exclusively)
- **Storage**: Local Storage for versions and settings

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd morphic-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Get your Groq API key**
   - Visit [console.groq.com](https://console.groq.com)
   - Sign up for free
   - Create an API key
   - Enter it in the app when prompted

## 🎯 How It Works

### 1. Describe Your App
Enter a natural language description of your app idea:
- "AI-powered todo list with smart categorization"
- "Real-time weather dashboard with beautiful animations"
- "Interactive memory card game with scoring"

### 2. Choose Configuration
- **Template**: Select from optimized app templates
- **Model**: Pick your preferred Groq model
- **AI Features**: Enable AI capabilities if needed

### 3. Generate & Preview
- Groq generates professional React code
- Instant live preview in browser
- View and edit the generated code
- Export full projects

### 4. Version Control
- All apps automatically saved
- Browse version history
- Export/import functionality
- Search and filter capabilities

## 🔧 Architecture

### Prompt System (`/src/prompts/`)
- **Token-optimized templates** for different app types
- **Injection system** for AI features
- **Fallback mechanisms** for error handling

### Services (`/src/services/`)
- **GroqService**: API integration and code generation
- **VersionService**: Local storage and version management

### Components (`/src/components/`)
- **AppGenerator**: Main generation interface
- **LivePreview**: Sandboxed app preview
- **CodeViewer**: Monaco-based code editor
- **VersionHistory**: Version management UI
- **ApiKeyModal**: Secure API key configuration

## 🎨 App Templates

### Basic App
General-purpose applications with clean interfaces

### AI Chat App
Conversational interfaces with Groq integration

### Dashboard
Data visualization and management interfaces

### Interactive Game
Engaging games with state management

### Utility Tool
Functional tools and calculators

## 🔐 Security

- **Local Storage**: API keys stored securely in browser
- **No Server**: Direct communication with Groq API
- **Sandboxed Preview**: Safe code execution environment
- **Input Sanitization**: Clean and validate all generated code

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
The app is a static React application that can be deployed to any static hosting service.

## 📝 Usage Examples

### Todo App with AI
```
"Create a todo app with AI-powered task prioritization, deadline suggestions, and smart categorization based on task content"
```

### Weather Dashboard
```
"Build a weather dashboard showing current conditions, 7-day forecast, interactive maps, and beautiful weather animations"
```

### Memory Game
```
"Design an interactive memory card game with multiple difficulty levels, scoring system, and progress tracking"
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast, powerful LLM inference
- **React Team** for the amazing framework
- **Tailwind CSS** for beautiful, utility-first styling
- **Monaco Editor** for the professional code editing experience

## 🔮 Future Enhancements

- [ ] Real-time collaboration
- [ ] Custom component library
- [ ] Advanced AI integrations
- [ ] Cloud deployment integration
- [ ] Team workspaces
- [ ] Plugin system

---

**Built with ❤️ using Groq AI and modern web technologies**
