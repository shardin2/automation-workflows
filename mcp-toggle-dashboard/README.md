# MCP Toggle Dashboard

Interactive CLI dashboard to toggle Claude Code MCP servers on/off without manually editing JSON files.

## 🎯 Purpose

Claude Code MCP servers consume context tokens even when not actively used. This tool lets you:
- ✅ Quickly enable/disable MCP servers
- 📊 View current status of all servers
- 💾 Safely modify `~/.claude.json` with automatic backups
- 🔄 Toggle multiple servers at once

## 📦 Installation

```bash
cd /Users/sampyhardiniii/Projects/mcp-toggle-dashboard
npm install
```

## 🚀 Usage

Run the dashboard:

```bash
npm start
# or
node index.js
```

### Features

**1. Toggle Specific Servers**
- Select one or multiple servers using spacebar
- Press Enter to confirm your selection
- Review changes before applying

**2. Enable All Servers**
- Quickly enable all MCP servers at once

**3. Disable All Servers**
- Quickly disable all MCP servers at once

**4. View Current Status**
- See which servers are enabled/disabled
- No changes made

## ⚙️ How It Works

The tool modifies your `~/.claude.json` file by moving server names between:
- `enabledMcpjsonServers` array (active servers)
- `disabledMcpjsonServers` array (inactive servers)

**Server configurations are never deleted** - only their enabled/disabled status changes.

## 🔒 Safety Features

- ✅ **Automatic backups**: Creates `.claude.json.backup` before any modifications
- ✅ **Validation**: Ensures JSON structure is valid before writing
- ✅ **Confirmation prompts**: Always asks before applying changes
- ✅ **No deletions**: Server configs are preserved, only status changes

## ⚠️ Important Notes

1. **Restart Required**: After toggling servers, you must restart Claude Code for changes to take effect
2. **Read-only backup**: The tool never modifies your backup file
3. **Safe to cancel**: You can exit at any time with Ctrl+C

## 📁 File Structure

```
mcp-toggle-dashboard/
├── index.js           # Main CLI application
├── lib/
│   ├── config.js      # Config file read/write operations
│   └── toggle.js      # Toggle logic functions
├── package.json       # Dependencies and metadata
└── README.md          # This file
```

## 🛠️ Technical Details

### Dependencies
- **inquirer**: Interactive CLI prompts
- **chalk**: Terminal colors and styling

### Config Location
- macOS/Linux: `~/.claude.json`
- Backup: `~/.claude.json.backup`

## 🐛 Troubleshooting

**"Config file not found"**
- Make sure you've run Claude Code at least once
- Check that `~/.claude.json` exists

**Changes not taking effect**
- Remember to restart Claude Code after toggling servers
- Verify the config was modified: `cat ~/.claude.json`

**Want to restore from backup**
```bash
cp ~/.claude.json.backup ~/.claude.json
```

## 📝 Example Workflow

1. Run the dashboard: `npm start`
2. Select "Toggle specific servers"
3. Use spacebar to select servers you want to toggle
4. Press Enter to confirm
5. Review the changes
6. Confirm to apply
7. Restart Claude Code

## 🤝 Contributing

This is a personal project, but feel free to fork and modify for your needs!

## 📜 License

MIT