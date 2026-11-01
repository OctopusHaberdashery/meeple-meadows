#!/usr/bin/env bash
# Builds Meeple Meadows into a signed APK without Gradle:
# aapt2 (resources) -> javac -> d8 (dex) -> zipalign -> apksigner.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
TOOLS="${ANDROID_BUILD_TOOLS:-/c/Users/mcnee/android-build}"
export JAVA_HOME="$(ls -d "$TOOLS"/jdk/jdk-* | head -1)"
export PATH="$JAVA_HOME/bin:$PATH"
BT="$TOOLS/bt/android-14"
JAR="$TOOLS/plat/android-34/android.jar"
VERSION_CODE="${VERSION_CODE:-1}"
VERSION_NAME="${VERSION_NAME:-1.0}"
# signing password lives in android/signing.env (git-ignored): KS_PASS=...
[ -f "$HERE/signing.env" ] && . "$HERE/signing.env"
: "${KS_PASS:?Set KS_PASS or create android/signing.env}"

OUT="$HERE/build"
rm -rf "$OUT"; mkdir -p "$OUT"/{res,gen,obj,dex,assets}

echo "• assets"
cp -r "$ROOT/web/." "$OUT/assets/"
rm -rf "$OUT/assets/dev"

echo "• resources"
"$BT/aapt2.exe" compile --dir "$HERE/res" -o "$OUT/res.zip"
"$BT/aapt2.exe" link -o "$OUT/base.apk" -I "$JAR" \
  --manifest "$HERE/AndroidManifest.xml" -A "$OUT/assets" --java "$OUT/gen" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  "$OUT/res.zip"

echo "• java"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 -bootclasspath "$JAR" -classpath "$BT/core-lambda-stubs.jar" -d "$OUT/obj" \
  $(find "$HERE/src" "$OUT/gen" -name '*.java')

echo "• dex"
java -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 --release --min-api 24 --lib "$JAR" --output "$OUT/dex" $(find "$OUT/obj" -name '*.class')

echo "• package"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT/dex" && "$JAVA_HOME/bin/jar" uf "$OUT/unsigned.apk" classes.dex)
"$BT/zipalign.exe" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

echo "• sign"
KS="$HERE/meeple-meadows.keystore"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -alias meeple -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" -dname "CN=Meeple Meadows, O=Home" >/dev/null
fi
java -jar "$BT/lib/apksigner.jar" sign --ks "$KS" --ks-key-alias meeple --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --out "$ROOT/MeepleMeadows.apk" "$OUT/aligned.apk"
java -jar "$BT/lib/apksigner.jar" verify --print-certs "$ROOT/MeepleMeadows.apk" | head -2
ls -la "$ROOT/MeepleMeadows.apk"
