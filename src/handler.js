const fs = require(`node:fs/promises`)
const path = require(`node:path`)
module.exports.runtime = {
  handler: async function (actionArguments) {
    try {
      const baseDir = `/app`
      let resolvedPath = path.isAbsolute(actionArguments.path) ? path.normalize(actionArguments.path) : path.join(baseDir, actionArguments.path)
      if (path.isAbsolute(actionArguments.path)) {
        resolvedPath = path.normalize(actionArguments.path)
      } else {
        resolvedPath = path.join(baseDir, actionArguments.path)
      }
      this.logger(`Listing path: ${resolvedPath}`)
      const stats = await fs.stat(resolvedPath)
      if (stats.isFile()) {
        const fileSize = stats.size
        const response = {
          path: resolvedPath,
          bytes: fileSize,
        }
        return JSON.stringify(response)
      } else if (stats.isDirectory()) {
        const entries = await fs.readdir(resolvedPath, {withFileTypes: true})
        const results = []
        for (const entry of entries) {
          const entryPath = path.join(resolvedPath, entry.name)
          if (entry.isFile()) {
            const fileStats = await fs.stat(entryPath)
            results.push({
              name: entry.name,
              path: entryPath,
              bytes: fileStats.size,
            })
          } else if (entry.isDirectory()) {
            const dirEntries = await fs.readdir(entryPath)
            results.push({
              name: entry.name,
              path: entryPath,
              items: dirEntries.length,
            })
          }
        }
        this.introspect(`<ls>\n  <input>${resolvedPath}</input>\n  <output>${JSON.stringify(results)}</output>\n</ls>`)
        return JSON.stringify(results)
      } else {
        const message = `The specified path is neither a file nor a directory.`
        this.introspect(message)
        this.logger(message)
        return message
      }
    } catch (error) {
      this.introspect(`Error accessing path: ${actionArguments.path}. Reason: ${error.message}`)
      this.logger(`Error accessing path: ${actionArguments.path}`, error.message)
      return `Failed to access the specified path: ${actionArguments.path}. Reason: ${error.message}`
    }
  },
}
