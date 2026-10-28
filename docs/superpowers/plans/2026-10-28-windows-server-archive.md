# Windows Server Archive Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline, task by task.

**Goal:** Replace the many-file Windows server payload with a runtime-readable archive and verify the replacement installer.

**Architecture:** Build an ASAR archive before Windows packaging, with native assets unpacked. Electron's Node mode runs the archived server; a narrow compatibility module resolves native executable and permissions paths to unpacked files. Other platforms retain the current standalone Node layout.

**Tech Stack:** Electron 45.1.0, Node 24.22.1, @electron/asar, electron-builder/NSIS, node:test.

**Spec:** `docs/superpowers/specs/2026-10-28-windows-server-archive.md`

## Constraints and review focus

- Preserve PostgreSQL migrations, UI assets, provider commands, and catalog data inside the archive.
- Native binaries and their companion files must remain directly executable.
- Keep user data separate from immutable installed files.
- Preserve startup registration through upgrades; remove it on uninstall.
- Keep macOS/Linux resource paths and standalone Node behavior unchanged.

## Tasks

1. Archive builder and native path support
   - [x] Write fixture tests for packed JavaScript, unpacked native companion files, executable paths, and chmod behavior; verify failure.
   - [x] Implement the archive builder and native path compatibility module; verify tests pass.
2. Windows runtime integration
   - [x] Update Electron and declare the archive builder dependency; refresh the lockfile.
   - [x] Connect the packaging hook, platform-specific resources, server entrypoint, and Windows Electron Node environment.
   - [x] Add cleanup of obsolete loose resources and update build documentation.
   - [x] Compile TypeScript and run all tests.
3. Replacement installer
   - [x] Package and verify startup registration, a fresh database, rendered UI, and native helpers using isolated data.
   - [x] Build the replacement NSIS installer, check integrity, and time a temporary install/uninstall.
   - [x] Record file-count/timing results, commit the verified change, and update the existing pull request.
