import vm from 'node:vm'

export const getBuilds = async function (branch) {
  const builds = (await (await fetch(`https://ci.android.com/builds/branch/${branch}/builds`)).json())

  builds.sort((a, b) => parseInt(b.buildId) - parseInt(a.buildId))

  return await Promise.all(builds.map(async build => {
    const { buildId, targets } = build

    return {
      artifacts: await Promise.all(targets.filter(target => target.build[1][7].endsWith('_phone-userdebug')).map(async target =>
        await getArtifact(buildId, target.build[1][7], `${target.build[1][8]}-img-${buildId}.zip`))
      ),
      branch,
      buildId
    }
  }))
}

export const getArtifact = async function (buildId, target, artifact) {
  const source = (await (await fetch(`https://ci.android.com/builds/submitted/${buildId}/${target}/latest/${artifact}`)).text()).split('\n').find(line => /^\s*var\s+JSVariables\s*=\s*/.test(line))

  const context = {}
  vm.runInContext(source, vm.createContext(context))

  return context.JSVariables
}
