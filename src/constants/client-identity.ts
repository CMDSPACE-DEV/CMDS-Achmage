// Identity this plugin presents to the outside world: MCP servers, public
// research APIs, and metadata embedded in generated artifacts.
//
// Keep this separate from the inherited storage identifiers documented in
// docs/lineage-identifiers.md. Those name data that already exists in a
// user's vault and must not be renamed; these name us to other systems and
// should always say who we actually are.
import { id, name, version } from '../../manifest.json'

export const CLIENT_ID = id
export const CLIENT_NAME = name
export const CLIENT_VERSION = version

export const ISSUES_URL = 'https://github.com/CMDSPACE-DEV/CMDS-Achmage/issues'
