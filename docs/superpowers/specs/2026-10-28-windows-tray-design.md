# Windows close-to-tray

Closing the main window or standalone launcher hides it to the Windows system
tray and keeps the existing server running. Double-clicking the icon or choosing
Open Paperclip restores the existing window. Quit in the tray or application menu
exits and stops the local server. Attached connection dialogs still close normally,
and programmatic window replacement must destroy the old window. OS shutdown must
not be blocked. Other platforms retain their existing behavior.

The user selected the system tray because it provides an explicit
Open/Quit menu; ordinary taskbar minimization alone does not provide that menu.
Use a bundled copy of the application ICO and Electron's existing Tray API, without new
dependencies or a settings screen.

Validation: 74 regression tests pass. Packaged Windows checks verify that closing
the standalone launcher and main window hides rather than destroys them; reopening
restores the same window; the API remains healthy while hidden; internal launcher
dismissal leaves no orphan windows; and explicit Quit exits both with and without
a running local server.

Desktop 3.2.19 fixes the generic Windows tray image by loading resources/tray.ico
directly instead of asking Windows to extract an icon from the executable. The
packaged ICO is byte-identical to build/icon.ico and loads as a nonempty native
image; the rendered 32-pixel preview shows the actual Paperclip mark.

Review follow-up: shutdown queries do not alter the explicit quit flag. The tray
close handler allows normal closing after the final session-end notification.
Windows hidden to the tray are tracked until an explicit show; launcher content
updates may resize them but cannot reveal or focus them. Both reported failures
were reproduced against the packaged app before the fix, then passed after it.
The regression suite now has 76 passing tests, including cancelled-query/final-end
handling and hidden-window state reset on show.
