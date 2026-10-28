# Windows server archive

The Windows package currently installs 85,301 loose server files. The installer is compressed already; expanding those files and copying them into place creates the installation bottleneck.

Package the server, UI, JavaScript dependencies, migrations, and catalog in `server.asar`. Leave native programs, native libraries, and their companion `native`, `vendor`, `prebuilds`, and `bin` directories in `server.asar.unpacked`. Run the archived server using Electron's Node mode. Use Electron 45.1.0, whose embedded Node 24.22.1 meets the server runtime requirement. Map executable and chmod paths to their unpacked native counterparts before importing the server.

The prototype reduced the server to one archive plus 4,030 native files. It initialized a fresh PostgreSQL database, applied migrations, returned healthy status, and served the static UI in 17.1 seconds. This is a prototype measurement, not an installation-time guarantee.

Keep the macOS and Linux runtime layouts unchanged. Preserve Windows startup registration and user data. Remove obsolete loose Windows runtime resources when upgrading or repairing an interrupted older installation. Verify the complete packaged interface, native helper execution, startup registration, and timed installation/uninstall before distributing the replacement.

## Verified Windows 3.2.16 results

| Check | Result |
| --- | --- |
| Complete installed file count | 4,106, previously 85,354 |
| Installer size | 474,802,412 bytes, previously 516,119,829 |
| Timed temporary installations | 32.86 seconds and 42.11 seconds |
| Final fresh packaged startup, including rendered UI | 15.86 seconds |
| Native programs/libraries | PostgreSQL initialization and migrations, Sharp PNG processing, Codex CLI version, synchronous and promise-based process execution passed |
| Cleanup | Uninstall, startup registration removal, and obsolete loose runtime removal passed |
| Automated tests | 68 passed |

These are local measurements on the test machine. The server archive remains packed at runtime. Native companion files are copied exactly by the Windows after-pack hook because electron-builder's dependency filters otherwise omit some scripts and vendor files. The compatibility layer preserves the custom promisification contract of `execFile`, including its `stdout`, `stderr`, and child-process handle.
