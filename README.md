# Terebyte transparency

Two public records: signed manifests of Terebyte's app builds, and the log of members' public keys for
sharing files with each other.

## App builds

Signed manifests of Terebyte's app builds. Each folder under `desktop/` is one build: `manifest.json`
lists every file the build made and the program inside each package, with their SHA-256 fingerprints,
and `manifest.sigstore.json` is its signature.

The signature is made by Terebyte's build on GitHub through [Sigstore](https://www.sigstore.dev/), with no
key of ours: GitHub vouches for which workflow made it, and Sigstore records every signature in its
public log. This repository only gains folders; nothing here is ever changed or removed.

### Checking a download

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

## Share keys

Members can share a file with another member with no link or password: the file's key is locked to the
recipient's public key on the sender's device. Every public key Terebyte publishes for that goes into an
append-only log, and `keys/log.jsonl` mirrors it: each entry's share ID (random, never an email), its
public keys (base64: X25519 then Ed25519, 64 bytes) and the day it was published.

Every hour, `scripts/key-log.mjs` fetches the new entries, recomputes the log's Merkle tree (RFC 6962,
each leaf `"terebyte/v1/share-key\n" ‖ shareId ‖ "\n" ‖ public keys`) from every entry kept here, and
checks the root equals the one terebyte.com serves. If any earlier entry were changed or removed, the
roots wouldn't match: the run fails and writes nothing. `keys/heads.jsonl` lists each head that checked
out. Run it yourself with `node scripts/key-log.mjs` (Node 20 or later, no dependencies).

Members' apps check the same thing for the keys they're given, and compare safety codes in person for the
rest: the log shows which keys exist, not which email address belongs to which share ID.
