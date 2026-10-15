# Terebyte transparency

Signed manifests of Terebyte's app builds. Each folder under `desktop/` is one build: `manifest.json`
lists every file the build made and the program inside each package, with their SHA-256 fingerprints,
and `manifest.sigstore.json` is its signature.

The signature is made by Terebyte's build on GitHub through [Sigstore](https://www.sigstore.dev/), with no
key of ours: GitHub vouches for which workflow made it, and Sigstore records every signature in its
public log. This repository only gains folders; nothing here is ever changed or removed.

## Checking a download

1. Find the folder for the version you downloaded.
2. Check the manifest's signature with [cosign](https://docs.sigstore.dev/cosign/system_config/installation/):

   ```
   cosign verify-blob --bundle manifest.sigstore.json \
     --certificate-oidc-issuer https://token.actions.githubusercontent.com \
     --certificate-identity https://github.com/terebytehq/terebyte/.github/workflows/desktop.yml@refs/heads/main \
     manifest.json
   ```

3. Compare your download's SHA-256 with the manifest's (`shasum -a 256` on a Mac, `Get-FileHash` in
   Windows PowerShell, `sha256sum` on Linux).
4. Once installed, the app's Settings → This app → Build shows the fingerprint of the program you're
   running; it should match the manifest's `programs` entry for your package.

The log makes a changed build visible; it doesn't stop one from being made.
