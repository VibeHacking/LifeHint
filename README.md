# LifeHint

**AI-Powered Communication Guardian for Respectful Interactions**

LifeHint is a lightweight desktop application that helps you communicate more thoughtfully by analyzing your intended words before you speak. Prevent unintentional offense or harassment by getting AI feedback on your communication before it reaches others.

## ✨ Highlights

🚀 **Fast & Lightweight** - Minimal resource usage with instant response times

🛡️ **Communication Guardian** - AI-powered analysis to prevent offensive or harassing language

⚡ **Real-time Feedback** - Instant analysis of your words before you send them

🤝 **Respectful Communication** - Help maintain positive and professional interactions

🎯 **Context-Aware** - Understands different communication contexts and audiences

🔄 **Auto-Expand Panel** - Smart panel behavior that opens when new analysis arrives

## 🛠 Installation

### Prerequisites

Before installing LifeHint, ensure you have the following installed:

- **Node.js** (version 20.x.x recommended)
- **Python** (latest version)
- **npm** (comes with Node.js)

### Verify Node.js Version

```bash
# Check your Node.js version
node --version

# If you need Node.js 20.x.x, use nvm (recommended):
# Install nvm first, then:
nvm install 20
nvm use 20
```

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/VibeHacking/LifeHint.git
   cd LifeHint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

## 🎮 Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + J` | Toggle main panel (expand/minimize) |
| `Ctrl + Shift + S` | Analyze your text/speech for potential issues |

### Basic Workflow

1. **Launch LifeHint** - The application starts with a minimized panel
2. **Check Your Communication** - Press `Ctrl + Shift + S` to analyze your intended message
3. **Review Feedback** - The panel automatically expands to show AI analysis and suggestions
4. **Improve Your Message** - Get recommendations to make your communication more respectful
5. **Toggle Panel** - Use `Ctrl + J` to manually expand or minimize the panel

### Features

- **Smart Panel Behavior**: The panel automatically opens when new communication analysis arrives
- **Multiple Check Modes**: Choose different modes for various communication contexts
- **Respectful Suggestions**: Get alternative phrasings that are more considerate
- **Responsive Design**: Panel dynamically adjusts height based on feedback content

## 🔧 Configuration

### Communication Check Modes

Select different check modes from the dropdown menu:
- **Harassment Check**: Detect potentially harassing or offensive language
- **Professional Tone**: Ensure your message maintains professional standards
- **Cultural Sensitivity**: Check for cultural or social sensitivity issues

## 🚀 Development

### Project Structure

```
src/
├── renderer/
│   ├── js/
│   │   └── app.js          # Main application logic
│   ├── css/
│   └── html/
└── main/                   # Electron main process
```

### Key Components

- **Panel Management**: Auto-expanding panel system
- **AI Communication Analysis**: Text analysis for respectful communication
- **Hotkey System**: Global keyboard shortcuts for quick checks
- **Suggestion System**: Alternative phrasing recommendations

## 📝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## 👥 Team

Developed by **VibeHacking** - Building tools for better human connections.

## 📄 License

This project is open source. Please check the license file for details.

---

**LifeHint** - Your communication guardian for more respectful and thoughtful interactions.