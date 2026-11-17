import { suggestTargets, summarize } from './game/balance'

const report = summarize()
console.log(report)
console.log('---')
console.log(suggestTargets())
if (report.startsWith('BALANCE FAIL')) {
  throw new Error('level layout or targets need another pass')
}
