import path from 'node:path'

export const getReleases = async function (url, urlPattern, artifactPattern) {
  const source = await (await fetch(url)).text()

  const urls = source.split('\n')
    .map(line => line.match(urlPattern))
    .filter(href => href !== null)
    .map(href => new URL(href, url))

  // Fix incorrect donwload URL on https://developer.android.com/topic/generic-system-image/releases
  const predicate = url => url.toString() === 'https://dl.google.com/developers/android/cinnamonbun/images/gsi/aosp_x86_64-exp-CP21.260330.008-15199860-401fffe1.zip'
  if (urls.filter(predicate).length === 2) {
    urls[urls.findIndex(predicate)] = new URL('https://dl.google.com/developers/android/cinnamonbun/images/gsi/aosp_x86_64-exp-CP31.260403.005.A1-15246833-f3bcc4ee.zip')
  }

  return urls.reduce((accumulator, url) => {
    const basename = path.basename(url.pathname)
    const match = artifactPattern.exec(basename)
    if (match === null) {
      throw new Error(`URL does not match pattern: ${url.href}`)
    }

    const { target, buildId } = match.groups
    let release = accumulator.find(release => release.buildId === buildId)
    if (release === undefined) {
      release = { artifacts: [], buildId }
      accumulator.push(release)
    }
    release.artifacts.push({
      artifact: basename,
      artifactUrl: url.href,
      buildId,
      target
    })
    return accumulator
  }, [])
}
