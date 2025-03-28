import vm from 'node:vm'

export const getBuilds = async function (branch) {
  const builds = (await (await fetch(`https://ci.android.com/builds/branch/${branch}/builds`)).json())

  return await Promise.all(builds.map(async build => {
    const { buildId, targets } = build

    return {
      artifacts: await Promise.all(targets.map(async target =>
        await getArtifact(buildId, target.target.target, `${target.target.product}-img-${buildId}.zip`))
      ),
      branch,
      buildId
    }
  }))
}

export const getArtifact = async function (buildId, target, artifact) {
  const source = (await (await fetch(`https://ci.android.com/builds/submitted/${buildId}/${target}/latest/${artifact}`)).text()).split('\n').find(line => /^\s*var\s+JSVariables\s*=\s*/.test(line))

  const context = {}
  vm.createContext(context)
  vm.runInContext(source, vm.createContext(context))

  return context.JSVariables
}
