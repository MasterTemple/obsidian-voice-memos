VAULT_DIR="/home/dgmastertemple/Dropbox/Apps/remotely-save/MasterTemple"
PLUGIN_DIR=".obsidian/plugins"
PLUGIN_NAME="obsidian-voice-memos"
OBSIDIAN_PLUGIN_DIR="$VAULT_DIR/$PLUGIN_DIR/$PLUGIN_NAME/"
npm run build
mkdir -p "$OBSIDIAN_PLUGIN_DIR"
cp ./main.js "$OBSIDIAN_PLUGIN_DIR"
cp ./manifest.json "$OBSIDIAN_PLUGIN_DIR"
cp ./styles.css "$OBSIDIAN_PLUGIN_DIR"
