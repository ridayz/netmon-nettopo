# 🎨 Archify Diagram Editor

Professional diagram editor with **Archify styling** - think Draw.io but with beautiful, modern UI!

## ✨ Features

### 🎯 Core Features
- **Drag & Drop Nodes** - Server, Database, Cloud, API components
- **Connect with Arrows** - Click and drag between nodes
- **Archify Style** - Beautiful gradients, shadows, and animations
- **Dark/Light Theme** - Toggle between themes
- **Export Options** - PNG and HTML export

### 🎨 Node Types
- 🖥️ **Server** - Purple gradient
- 🗄️ **Database** - Green gradient  
- ☁️ **Cloud** - Pink gradient
- 🔌 **API** - Blue gradient

### 📤 Export
- **PNG Export** - High-res image download
- **HTML Export** - Standalone file with diagram data
- **JSON Support** - Save/load diagrams (coming soon)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 🎮 How to Use

### Adding Nodes
1. Click node buttons in toolbar (Server, Database, Cloud, API)
2. Nodes appear randomly on canvas
3. Drag to reposition

### Connecting Nodes
1. Click on a node's handle (white dots)
2. Drag to another node's handle
3. Connection created with animation!

### Editing
- **Select**: Click node to select (shows glow effect)
- **Move**: Drag nodes around canvas
- **Delete**: Select node/edge + press Delete key
- **Zoom**: Mouse wheel or Controls panel

### Theme
- Click **🌙 Dark / ☀️ Light** button to toggle
- Changes canvas, nodes, and UI colors

### Export
- **🖼️ Export PNG**: Download diagram as image
- **💾 Export HTML**: Save as standalone HTML file

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **React Flow** - Diagram engine
- **Framer Motion** - Animations (ready to add)
- **html-to-image** - PNG export
- **Vite** - Build tool

## 📂 Project Structure

```
archify-diagram-editor/
├── src/
│   ├── nodes/
│   │   ├── ServerNode.tsx    - Server component
│   │   ├── DatabaseNode.tsx  - Database component
│   │   ├── CloudNode.tsx     - Cloud component
│   │   └── APINode.tsx       - API component
│   ├── theme.ts              - Archify color schemes
│   ├── App.tsx               - Main canvas & logic
│   ├── main.tsx              - Entry point
│   └── index.css             - Global styles
├── index.html
├── package.json
└── README.md
```

## 🎨 Archify Style Guide

### Colors
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Secondary**: Pink gradient (#f093fb → #f5576c)
- **Success**: Green gradient (#11998e → #38ef7d)
- **Info**: Blue gradient (#4facfe → #00f2fe)

### Design Principles
- **Gradients** - Every node uses smooth gradients
- **Shadows** - Layered shadows for depth
- **Rounded** - 12px border radius
- **Smooth** - 0.3s transitions on all interactions
- **Glow Effects** - Selected nodes get glowing outline

## 🚧 Roadmap

- [ ] Save/Load diagram (JSON)
- [ ] Custom node text editing
- [ ] More node types (Load Balancer, Queue, etc)
- [ ] Group/Container nodes
- [ ] Snap to grid
- [ ] Undo/Redo
- [ ] Keyboard shortcuts
- [ ] Export to SVG
- [ ] Share diagram via URL
- [ ] Templates library

## 💡 Tips

- **Right-click node** - Delete or edit (coming soon)
- **Space + Drag** - Pan canvas
- **Ctrl + Mouse Wheel** - Zoom
- **Delete key** - Remove selected items
- **Minimap** - Quick navigation (bottom-left)

## 🐛 Known Issues

- Export HTML only saves JSON data (visual export coming)
- Node text not editable yet (planned feature)

## 📝 License

MIT - Build whatever you want!

## 🎉 Credits

Built with ❤️ using Archify design system style
Inspired by Draw.io, Lucidchart, and Figma

---

**Created:** 2026-09-29  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
