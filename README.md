# MEMPRO Client

**MCP Client für MEMPRO V4** - Verbindet Claude Desktop mit dem zentralen Memory-Backend auf Hetzner.

## 🚀 Quick Start

### Installation (Mac + Windows + Linux)

```bash
# Einmalig - keine weitere Installation notwendig!
npx -y mempro-client
```

### Claude Desktop Konfiguration

**Mac/Linux** (`~/.claude.json`):
```json
{
  "mcpServers": {
    "mempro": {
      "command": "npx",
      "args": ["-y", "mempro-client"]
    }
  }
}
```

**Windows** (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "mempro": {
      "command": "npx",
      "args": ["-y", "mempro-client"]
    }
  }
}
```

### Claude neu starten

1. Claude Desktop komplett schließen
2. Neu starten
3. ✅ MCP Tools sollten verfügbar sein

## 🎯 Verfügbare Tools

### `mempro_health()`
Backend Health-Check

```javascript
{
  "status": "ok",
  "backends": {
    "openmemory": "ok",
    "zep": "ok",
    "lightrag": "ok",
    "pieces": "disabled"
  }
}
```

### `mempro_add(text, user_id?)`
Memory speichern (parallel in OpenMemory + Zep)

**Beispiel:**
```
Speichere: "MEMPRO V4 läuft auf Hetzner mit OpenMemory, Zep und LightRAG"
```

**Rückgabe:**
```json
{
  "openmemory": {
    "id": "uuid-...",
    "sectors": ["semantic"],
    "chunks": 1
  },
  "zep": {
    "uuid": "uuid-...",
    "content": "...",
    "created_at": "2025-11-18T..."
  },
  "status": "ok"
}
```

### `mempro_query(query, user_id?)`
Memory abfragen (kombiniert OpenMemory + Zep)

**Beispiel:**
```
Frage: "Was läuft auf Hetzner?"
```

**Rückgabe:**
```json
{
  "openmemory": [
    {
      "id": "...",
      "content": "MEMPRO V4 läuft auf Hetzner...",
      "score": 0.95,
      "source": "openmemory"
    }
  ],
  "zep": [
    {
      "edges": [...]
    }
  ],
  "combined": [...]
}
```

### `mempro_search(query, user_id?, top_k?)`
Vektor-Suche (Multi-Backend)

**Beispiel:**
```
Suche: "Hetzner Server", top_k=3
```

**Rückgabe:**
```json
{
  "results": [
    {
      "id": "...",
      "content": "...",
      "score": 0.998,
      "source": "openmemory"
    }
  ]
}
```

## 🏗️ Architektur

```
┌──────────────────────────────────────┐
│   HETZNER (135.181.128.98:8821)      │
│                                      │
│   MEMPRO V4 Backend                  │
│   ├─ OpenMemory (lokal HSG)          │
│   ├─ LightRAG (lokal KG)             │
│   └─ Zep Cloud (Graphiti v3)         │
└─────────────┬────────────────────────┘
              │
        HTTP API
              │
    ┌─────────┼─────────┬─────────┐
    │         │         │         │
┌───▼────┐ ┌─▼──────┐ ┌▼───────┐ ┌▼──────┐
│Mac     │ │Windows │ │Linux   │ │  ...  │
│        │ │  PC    │ │  PC    │ │       │
│MCP     │ │MCP     │ │MCP     │ │MCP    │
│Client  │ │Client  │ │Client  │ │Client │
└────────┘ └────────┘ └────────┘ └───────┘
```

**Keine Installation auf jedem PC!**
- ✅ Zentrale Daten auf Hetzner
- ✅ Kein Sync notwendig
- ✅ Ein Befehl für alle Plattformen

## 🔧 Erweiterte Konfiguration

### Custom Backend URL

```json
{
  "mcpServers": {
    "mempro": {
      "command": "npx",
      "args": ["-y", "mempro-client"],
      "env": {
        "MEMPRO_URL": "https://custom-mempro.example.com"
      }
    }
  }
}
```

### Multi-User Setup

```json
{
  "mcpServers": {
    "mempro-mac": {
      "command": "npx",
      "args": ["-y", "mempro-client"],
      "env": {
        "DEFAULT_USER": "thorsten-mac"
      }
    }
  }
}
```

## 📊 System Requirements

- **Node.js**: >= 18.0.0
- **Netzwerk**: Zugriff auf Hetzner Server (135.181.128.98:8821)
- **Claude Desktop**: Beliebige Version mit MCP-Support

## 🆘 Troubleshooting

### Tools nicht verfügbar
1. Claude komplett schließen und neu starten
2. Config-Datei prüfen (JSON valide?)
3. Terminal öffnen: `npx -y mempro-client` (sollte warten, nicht crashen)

### Connection refused
```bash
# Test vom PC:
curl http://135.181.128.98:8821/healthz
# Sollte: {"status":"ok","backends":{...}}
```

Falls nicht:
- Firewall-Regeln prüfen
- VPN/Netzwerk-Config prüfen
- Backend läuft? (auf Hetzner prüfen)

### NPX lädt ewig
```bash
# Alternative: Globale Installation
npm install -g mempro-client

# Dann in Config:
"command": "mempro-client"
```

## 📝 Development

```bash
# Clone repo
git clone https://github.com/thorsten-secstack/mempro-client.git
cd mempro-client

# Install deps
npm install

# Test lokal
node index.js
# (wartet auf stdin - Ctrl+C zum Beenden)
```

## 📄 License

MIT License - Copyright (c) 2025 Thorsten SecStack

## 🔗 Links

- **Backend**: MEMPRO V4 auf Hetzner
- **Dashboard**: http://135.181.128.98:8821/status
- **Health**: http://135.181.128.98:8821/healthz

---

**Made with ❤️ for centralized memory orchestration**
