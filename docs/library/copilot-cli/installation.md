# Installation — GitHub Copilot CLI 🚀

There are multiple supported installation methods. Choose the one that suits your platform and update preferences.

1. Shell install (macOS / Linux)

```bash
# Basic installation (cross-platform for macOS / Linux)
curl -fsSL https://gh.io/copilot-install | bash

# Alternative using wget
wget -qO- https://gh.io/copilot-install | bash

# Install as root to /usr/local/bin
curl -fsSL https://gh.io/copilot-install | sudo bash

# Install specific version to custom directory
curl -fsSL https://gh.io/copilot-install | VERSION="v0.0.369" PREFIX="$HOME/custom" bash
```

1. Package managers (recommended for updates)

```bash
# Windows (winget)
winget install GitHub.Copilot
winget install GitHub.Copilot.Prerelease

# macOS / Linux (Homebrew)
brew install copilot-cli
brew install copilot-cli@prerelease

# npm (all platforms)
npm install -g @github/copilot
npm install -g @github/copilot@prerelease
```

Verification

- Run `copilot help` or `copilot --version` after installation.
- Ensure the `copilot` binary is on your PATH (e.g., `~/.local/bin` for some installs).

Notes

- Package managers simplify upgrades. If you installed with the shell script, repeat the installation command to update or use package managers where available.
- If you use a custom PREFIX, ensure your PATH points to the install directory.

Sources: Official install scripts and package instructions.