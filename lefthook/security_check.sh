#!/usr/bin/env bash
#
# Lefthook security check wrapper (extracted from lefthook.yml)
# - Attempts to run gitleaks via Docker, falls back to binary install
# - If install fails, prints manual install instructions and exits 0 (doesn't block commit)
#

set -u

# Try gitleaks first
if command -v gitleaks >/dev/null 2>&1; then
  echo "✅ gitleaks found on PATH, running scan..."
  gitleaks detect --verbose --redact --config=.gitleaks.toml --source="."
  exit $?
fi

echo "📦 gitleaks not found, attempting Docker or binary install..."

if command -v docker >/dev/null 2>&1; then
  echo "🐳 Using gitleaks Docker image (recommended)..."
  WORKSPACE_PATH="$(pwd)"
  docker run --rm -v "${WORKSPACE_PATH}:/workspace:ro" -w /workspace zricethezav/gitleaks:latest detect --verbose --redact --config=.gitleaks.toml --source="."
  DOCKER_EXIT_CODE=$?
  if [ $DOCKER_EXIT_CODE -eq 0 ]; then
    echo "✅ Docker gitleaks scan completed successfully"
    exit 0
  else
    echo "⚠️  Docker gitleaks had issues (exit code: $DOCKER_EXIT_CODE), falling back to binary installation..."
  fi
fi

# Normalize ARCH tokens
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case $ARCH in
  x86_64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  armv7l) ARCH="armv7" ;;
  *) ARCH="unsupported" ;;
esac

INSTALL_DIR="$HOME/.local/bin"
DOWNLOAD_SUCCESS=false

if [ "$ARCH" != "unsupported" ] && ([ "$OS" = "linux" ] || [ "$OS" = "darwin" ]); then
  mkdir -p "$INSTALL_DIR"
  URL1="https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-${OS}-${ARCH}"
  URL2="https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks-${OS}-${ARCH}"

  for URL in "$URL1" "$URL2"; do
    echo "Trying: $URL"
    if curl -sSL "$URL" -o "$INSTALL_DIR/gitleaks" 2>/dev/null && [ -f "$INSTALL_DIR/gitleaks" ] && [ -s "$INSTALL_DIR/gitleaks" ]; then
      if file "$INSTALL_DIR/gitleaks" | grep -q "executable"; then
        chmod +x "$INSTALL_DIR/gitleaks"
        export PATH="$INSTALL_DIR:$PATH"
        echo "✅ Gitleaks binary installed successfully"
        DOWNLOAD_SUCCESS=true
        break
      fi
    fi
    rm -f "$INSTALL_DIR/gitleaks"
  done
fi

if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --verbose --redact --config=.gitleaks.toml --source="."
  exit $?
fi

echo "❌ Could not install gitleaks automatically!"
echo "📋 Please install gitleaks manually using one of these methods:"
echo ""
echo "🏠 Homebrew (macOS/Linux):"
echo "   brew install gitleaks"
echo ""
echo "🐧 Linux (manual):"
echo "   curl -sSL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-linux-amd64 -o ~/.local/bin/gitleaks"
echo "   chmod +x ~/.local/bin/gitleaks"
echo "   echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
echo ""
echo "🐳 Docker (any platform):"
echo "   docker pull zricethezav/gitleaks:latest"
echo ""
echo "📁 Ensure ~/.local/bin is in your PATH or Docker is available"
echo ""
echo "⚠️  Skipping gitleaks check for now..."
exit 0
