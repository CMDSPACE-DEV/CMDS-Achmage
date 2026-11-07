# AI diagram proposals
The service uses the selected existing chat provider. Generation and revision
return a parsed proposal; neither writes the vault. The editor must show the
proposal and require acceptance. Acceptance compares the source fingerprint,
and file saving separately compares the vault snapshot. Cancellation discards
late responses. Tests use fake provider responses; no live model call is claimed.
The common editor PR supplies the UI. Bundle and real Obsidian gates stay open.
