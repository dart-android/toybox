import { JSDOM } from 'jsdom'

const dom = await JSDOM.fromURL('https://developer.android.com/topic/generic-system-image/releases')

const urls = Array.from(dom.window.document.querySelectorAll('a[href^="https://dl.google.com/developers/android/"][href*="/images/gsi/aosp_"][href$=".zip"]')).map(a => new URL(a.href))

const releases = urls.reduce((accumulator, url) => {
  const match = /(?:\/)(?<target>aosp_.*?)-exp-(?<build>.*?)-(?<id>.*?)(?:-.*?)?\.zip$/.exec(url.pathname)
  if (match === null) {
    throw new Error(`URL does not match pattern: ${url.href}`)
  }

  const { target, build, id } = match.groups
  let release = accumulator.find(release => release.build === build && release.id === id)
  if (release === undefined) {
    release = { build, id, artifacts: [] }
    accumulator.push(release)
  }
  release.artifacts.push({
    target,
    image: url.href
  })
  return accumulator
}, [])

const argv = process.argv.slice(2)

console.log(JSON.stringify(argv.length > 0 ? releases.filter(release => argv.includes(release.build) || argv.includes(release.id)) : releases))
