# Windows Tray Implementation Plan

**Goal:** Keep Paperclip running when its window closes and provide explicit Quit.
**Architecture:** A Windows tray owned by the main process; close-event handlers
hide user-facing windows unless the app is quitting. Preserve server shutdown.
**Tech Stack:** Electron, TypeScript, node:test.
**Spec:** ../specs/2026-10-28-windows-tray-design.md

- [x] Add failing tests for close interception, explicit quit, and tray actions.
- [x] Implement the tray menu and window lifecycle changes in src/main.ts and
  src/windows-tray.ts. Ensure attached dialogs and internal replacement still close.
- [x] Run TypeScript and regression tests, then packaged close/restore/quit checks.
- [x] Build desktop 3.2.18 with the existing verified server payload, update the
  installed app, and commit/push to the open MR targeting develop.
