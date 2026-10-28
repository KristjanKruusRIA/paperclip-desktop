# Windows update feed and upstream upgrade

Desktop 3.2.17 bundles the stable Paperclip server, published UI, and teams
catalog at 2026.1023.0. Nightly and canary releases are excluded.

Windows updates use `KristjanKruusRIA/paperclip-desktop`. macOS and Linux retain
their existing release source. The Windows after-pack hook writes the update
configuration even for directory builds subsequently packaged with
`--prepackaged`; electron-builder otherwise skips it without an installer target.

An empty release source or missing Windows channel manifest is reported as an
unavailable update source, rather than claiming the installed version is current.
The release source must publish the Windows installer, blockmap, and `latest.yml`
before it can deliver updates.

Server preparation clears the previous staged bundle before copying dependencies
and UI assets, so upgrades cannot retain files removed by upstream. Upstream's
browser login flow is retained; the remaining xAI terminal command uses PowerShell
on Windows.

The server runs from its installed package directory. Its npm dependency tree
remains intact: overlaying server-local dependencies onto the bundle root replaced
`content-type` 1.x required by the MCP SDK with incompatible 3.x and prevented
the 2026.1023.0 server from starting.

Verified on Windows: all 71 regression tests pass; the packaged application
migrates the prior 2026.1001.0 test database and serves the new UI with health
version 2026.1023.0. A subsequent start completed in 10.9 seconds. Packaged native
image processing and Codex CLI 0.160.0 pass, and a real check against the fork's
empty release feed displays "Update Source Not Ready".
