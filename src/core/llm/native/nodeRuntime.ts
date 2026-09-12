import { Buffer as NodeBuffer } from 'buffer'
import * as childProcess from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

/**
 * Desktop Node builtins, imported statically so esbuild can externalize them.
 * The plugin is `isDesktopOnly`, so these modules are always available at runtime.
 */
export { fs, os, path, childProcess }
export const spawn = childProcess.spawn
export const Buffer = NodeBuffer
