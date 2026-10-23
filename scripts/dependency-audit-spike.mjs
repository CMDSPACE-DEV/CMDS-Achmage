import fs from 'node:fs'
const [beforePath, beforeLockPath, beforeMetaPath, afterPath, outputPath, baseline = '8693360'] = process.argv.slice(2)
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const before = read(beforePath), baselineLock = read(beforeLockPath), baselineMeta = read(beforeMetaPath)
const after = read(afterPath), lock = read('package-lock.json'), meta = read('meta.json')
const names = ['ajv','brace-expansion','drizzle-orm','fast-uri','form-data','hono','js-yaml','langsmith','minimatch','prismjs','qs','uuid','ws','yaml']
const bytes = (m, n) => Object.values(m.outputs).flatMap(o => Object.entries(o.inputs)).filter(([p]) => p.includes(`node_modules/${n}/`)).reduce((sum, [, v]) => sum + v.bytesInOutput, 0)
const versions = (l, n) => Object.entries(l.packages).filter(([p]) => p.endsWith(`node_modules/${n}`)).map(([path,v]) => ({ path, version:v.version, dev:!!v.dev }))
const parents = (l, n) => Object.entries(l.packages).filter(([,p]) => p.dependencies?.[n] || p.devDependencies?.[n]).map(([path,p])=>({path:path || '(root)',range:p.dependencies?.[n] ?? p.devDependencies?.[n]}))
const report = {
  baseline, date:'2026-10-14', before:before.metadata.vulnerabilities, after:after.metadata.vulnerabilities,
  named: names.map(name=>({name,before:versions(baselineLock,name),parents:parents(baselineLock,name),beforeBundledBytes:bytes(baselineMeta,name),after:versions(lock,name),afterBundledBytes:bytes(meta,name),advisories:before.vulnerabilities[name]?.via.filter(v=>typeof v==='object').map(({source,title,url,range})=>({source,title,url,range})),remaining:after.vulnerabilities[name] ?? null})),
  residual:Object.entries(after.vulnerabilities).map(([name,v])=>({name,severity:v.severity,versions:versions(lock,name).filter(x=>v.nodes.includes(x.path)),bundledBytes:bytes(meta,name),via:v.via.map(x=>typeof x==='string'?x:{title:x.title,url:x.url,range:x.range}),fixAvailable:v.fixAvailable})),
}
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({named:report.named.length,residual:report.residual.length,bundledResidual:report.residual.filter(x=>x.bundledBytes>0).map(x=>x.name),nonDevResidual:report.residual.filter(x=>x.versions.some(v=>!v.dev)).map(x=>x.name)}))
