# Correction, November 6, 2026: three Windows fingerprints

Three signed manifests in this log give the wrong fingerprint for the Windows program. They stay as they were,
because a log that gets edited isn't one. This entry says what's wrong in them, and what's right.

| Manifest | Package | Program | Wrong fingerprint, as published | Right fingerprint |
| --- | --- | --- | --- | --- |
| `desktop/2026.10.30-651aadf412c0` | `Terebyte_2026.10.30_x64-setup.exe` | `terebyte-desktop.exe` | `efc106012788ffffd09a3d4c9533f72e44bc03059552879d3fea5e6901f8d4c8` | `f3f6ff02259d5b8e15cb480db6f2db085a40f547e52f0f81f416e27344899fcf` |
| `desktop/2026.10.30-4da239a90440` | `Terebyte_2026.10.30_x64-setup.exe` | `terebyte-desktop.exe` | `2e9dea9d0680b9c5debf205cef317354464267ae1a12404519bd4d80738d3fef` | `759548688082958294b00e3ec9fe259c5bac79ee65a6f26ccc8af5569d81d5d9` |
| `desktop/2026.10.30-96aebbaee7b1` | `Terebyte_2026.10.30_x64-setup.exe` | `terebyte-desktop.exe` | `99a93c075fb7bb88adf51b5426b2ded363318ba5d709d32afff52a5ba25e0de8` | `51ad51b02a17ad59e6a9eb97bc0f839fd1beccb4b32e318fd0ed325017250dea` |

The same table, for programs to read, is in `correction.json`.

## The cause

The build's hash step ran on the unsigned restored file. The tool that makes the Windows installer marks the
program with its package type, signs it if signing is on, and packs it. It then puts the original file back where
it found it, unmarked and unsigned. The hash step read that file, so the fingerprint it wrote is of a file no
installer contains.

## What this touches

- **Wrong:** the Windows row of `programs` in these three manifests, and nothing else we've found.
- **Still right:** the fingerprint of every package in `files`. We also read the Mac program from each `.dmg` and the
  Linux program from each `.deb` on November 6, and all six match their manifests. We didn't re-read the AppImage
  rows; the build reads those from inside the package.
- **Who it reaches:** none of these three builds was ever offered for download. The one release at the time, also
  numbered 2026.10.30, was built on October 13 from commit `f7129f2bd919`. It's older than this log and has no folder
  here. Anyone who has one of these builds anyway will see the right fingerprint in Settings → This app → Build.

## How we got the right fingerprints

On a clean Windows machine, we installed each build from its own installer and took the SHA-256 of the installed
program. We also read the program out of the installer, and the two were the same.

| Manifest | Build run | Install check run |
| --- | --- | --- |
| `2026.10.30-651aadf412c0` | 39777501538 | 42179626913 |
| `2026.10.30-4da239a90440` | 40884011997 | 42179758641 |
| `2026.10.30-96aebbaee7b1` | 42049775306 | 42179869894 |

## What you can and can't check

Those runs are in our private repository, and these three installers aren't public, so you can't repeat this
yourself. This entry is also a plain commit. Unlike a manifest, it isn't signed through Sigstore, and git history
can be rewritten. The right-hand column above is our word; the wrong one you can see in the signed manifests.

## The fix

The build now hashes the program it reads from inside the installer (commits `6c8f4716` and `e9320481` in our
repository). The first build with the fix, run 42181821959, went through the same check, run 42186672252: the
fingerprint it lists is the installed program's.
