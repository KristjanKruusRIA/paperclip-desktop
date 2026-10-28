# Native Windows provider sign-in

Paperclip 2026.1023.0 starts local subscription authentication through Python's
Unix-only `pty` module. On Windows it exits before Claude or Codex can sign in.

Windows desktop builds patch the local browser-login entry point to open an
interactive Windows PowerShell terminal. Claude runs `auth login`; Codex runs
`login --device-auth`. The provider CLI owns the browser interaction and writes
credentials into the existing connection-specific CLAUDE_CONFIG_DIR or CODEX_HOME.
Paperclip's existing verified-credential polling and account completion remain
responsible for accepting the connection.

The launcher passes paths through child environment variables, uses encoded
PowerShell commands, and translates bundled ASAR executable paths to their physical
unpacked locations. Existing API/token environment variables are cleared in the
child; no provider output is logged. Cancellation stops the sign-in process tree
by its PID. Waiting is limited to the login terminal, not unrelated browser lifetime.
The Unix browser-login driver is retained. Development and packaged preparation
apply the same idempotent patch without mutating pnpm's hard-linked store.

Verification includes a compiled dummy CLI executed through an actual hidden
Windows console: stdin and stdout are console handles rather than pipes, the
credential-home path containing quotes/ampersands/percent signs is preserved, and
the native login arguments arrive correctly. Unit tests cover both providers,
credential-home isolation, physical executable paths, cancellation, missing-terminal
errors, and repeated patching.

All 83 regression tests pass. Packaged Electron/ASAR probes exercise the actual
patched entry point for both providers with a dummy CLI, including native Codex
executable resolution. Packaged startup, interface, health, tray lifecycle,
cancelled-shutdown, and hidden-launcher regressions also pass. Real provider
authentication still requires the user to finish the browser flow.
