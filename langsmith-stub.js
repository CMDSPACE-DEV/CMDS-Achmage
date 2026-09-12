/**
 * Production stub for langsmith.
 *
 * LangChain statically imports LangSmith tracing. This plugin never talks to
 * LangSmith, so the real client (~100KB) is replaced with the surface
 * @langchain/core actually touches.
 */

const absentRunTreeError =
  'Could not get the current run tree.\n\nPlease make sure you are calling this method within a traceable function and that tracing is enabled.'

function stripNonAlphanumeric(input) {
  return input.replace(/[-:.]/g, '')
}

function getMicrosecondPrecisionDatestring(epoch, executionOrder = 1) {
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, '0')
  return `${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`
}

export function convertToDottedOrderFormat(epoch, runId, executionOrder = 1) {
  const microsecondPrecisionDatestring = getMicrosecondPrecisionDatestring(
    epoch,
    executionOrder,
  )
  return {
    dottedOrder: stripNonAlphanumeric(microsecondPrecisionDatestring) + runId,
    microsecondPrecisionDatestring,
  }
}

export function getDefaultProjectName() {
  return 'default'
}

export function getCurrentRunTree(permitAbsentRunTree = false) {
  if (!permitAbsentRunTree) {
    throw new Error(absentRunTreeError)
  }
  return undefined
}

export function isTraceableFunction(value) {
  return typeof value === 'function' && 'langsmith:traceable' in value
}

export class Client {
  constructor() {}
  async createRun() {
    return {}
  }
  async updateRun() {}
  async createFeedback() {}
}

export class RunTree {
  constructor(originalConfig = {}) {
    if (isRunTree(originalConfig)) {
      Object.assign(this, { ...originalConfig })
      this.child_runs = this.child_runs ?? []
      this.events = this.events ?? []
      this.extra = this.extra ?? {}
      return
    }

    const config = originalConfig ?? {}
    Object.assign(this, config)
    this.child_runs = config.child_runs ?? []
    this.events = config.events ?? []
    this.extra = { ...config.extra }
    this.start_time = config.start_time ?? Date.now()
    this.run_type = config.run_type ?? 'chain'
    this.project_name = config.project_name ?? getDefaultProjectName()
    this.tracingEnabled = config.tracingEnabled ?? false
    this.execution_order = config.execution_order ?? 1
    this.child_execution_order = config.child_execution_order ?? 1
  }

  createChild(config = {}) {
    const childExecutionOrder = (this.child_execution_order ?? 1) + 1
    const child = new RunTree({
      ...config,
      parent_run: this,
      project_name: this.project_name,
      client: this.client,
      tracingEnabled: this.tracingEnabled,
      execution_order: childExecutionOrder,
      child_execution_order: childExecutionOrder,
    })
    this.child_runs.push(child)
    this.child_execution_order = childExecutionOrder
    return child
  }

  async postRun() {}

  async patchRun() {}
}

export function isRunTree(value) {
  return (
    value != null &&
    typeof value.createChild === 'function' &&
    typeof value.postRun === 'function'
  )
}
