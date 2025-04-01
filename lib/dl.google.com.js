import path from 'node:path'

export const getReleases = async function (url, urlPattern, artifactPattern) {
  const source = await (await fetch(url)).text()

  const urls = source.split('\n')
    .map(line => line.match(urlPattern))
    .filter(href => href !== null)
    .map(href => new URL(href, url))

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
