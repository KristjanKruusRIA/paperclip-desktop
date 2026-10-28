# Windows close-to-tray

Closing the main window or standalone launcher hides it to the Windows system
tray and keeps the existing server running. Double-clicking the icon or choosing
Open Paperclip restores the existing window. Quit in the tray or application menu
exits and stops the local server. Attached connection dialogs still close normally,
and programmatic window replacement must destroy the old window. OS shutdown must
not be blocked. Other platforms retain their existing behavior.

The user selected the system tray because it provides an explicit
Open/Quit menu; ordinary taskbar minimization alone does not provide that menu.
Use the installed executable's icon and Electron's existing Tray API, without new
dependencies or a settings screen.

Validation: 74 regression tests pass. Packaged Windows checks verify that closing
the standalone launcher and main window hides rather than destroys them; reopening
restores the same window; the API remains healthy while hidden; internal launcher
dismissal leaves no orphan windows; and explicit Quit exits both with and without
a running local server.
