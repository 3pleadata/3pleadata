#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   3PLE A FinTech - Android Release Keystore Generator     "
echo "=========================================================="

KEYSTORE_DIR="android/app"
KEYSTORE_FILE="$KEYSTORE_DIR/release.keystore"
ALIAS="threeplea"
STOREPASS="ThreePleA2026Secure!"

if [ -f "$KEYSTORE_FILE" ]; then
  echo "Keystore already exists at: $KEYSTORE_FILE"
  exit 0
fi

mkdir -p "$KEYSTORE_DIR"

if command -v keytool &> /dev/null; then
  echo "Generating 4096-bit RSA release signing key..."
  keytool -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 4096 \
    -validity 10000 \
    -storepass "$STOREPASS" \
    -keypass "$STOREPASS" \
    -dname "CN=3PLE A DATA, OU=Fintech Operations, O=3PLE A DATA (RC 9746103), L=Tarauni, ST=Kano, C=NG"
  echo "Keystore successfully generated at: $KEYSTORE_FILE"
else
  echo "[NOTICE] 'keytool' is not installed in this Linux container."
  echo "On your development workstation or CI/CD environment with Java JDK 17+ installed, execute:"
  echo ""
  echo "keytool -genkeypair -v -keystore android/app/release.keystore -alias $ALIAS -keyalg RSA -keysize 4096 -validity 10000 -storepass $STOREPASS -keypass "$STOREPASS" -dname \"CN=3PLE A DATA, OU=Fintech Operations, O=3PLE A DATA (RC 9746103), L=Tarauni, ST=Kano, C=NG\""
fi
