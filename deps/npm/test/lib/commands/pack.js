const t = require('tap')
const { fake: mockNpm } = require('../../fixtures/mock-npm')
const pacote = require('pacote')
const path = require('path')

const OUTPUT = []
const output = (...msg) => OUTPUT.push(msg)

const libnpmpack = async (spec, opts) => {
  if (!opts)
    throw new Error('expected options object')

  return ''
}
const mockPacote = {
  manifest: (spec) => {
    if (spec.type === 'directory')
      return pacote.manifest(spec)
    const m = {
      name: spec.name || 'test-package',
      version: spec.version || '1.0.0-test',
    }
    m._id = `${m.name}@${m.version}`
    return m
  },
}

t.afterEach(() => OUTPUT.length = 0)

t.test('should pack current directory with no arguments', async t => {
  let tarballFileName
  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => {
        tarballFileName = file
        cb()
      },
    },
  })
  const npm = mockNpm({
    output,
  })
  const pack = new Pack(npm)

  await pack.exec([])
  const filename = `npm-${require('../../../package.json').version}.tgz`
  t.strictSame(OUTPUT, [[filename]])
  t.strictSame(tarballFileName, path.resolve(filename))
})

t.test('follows pack-destination config', async t => {
  let tarballFileName
  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => {
        tarballFileName = file
        cb()
      },
    },
  })
  const npm = mockNpm({
    config: {
      'pack-destination': '/tmp/test',
    },
    output,
  })
  const pack = new Pack(npm)

  await pack.exec([])

  const filename = `npm-${require('../../../package.json').version}.tgz`
  t.strictSame(OUTPUT, [[filename]])
  t.strictSame(tarballFileName, path.resolve('/tmp/test', filename))
})

t.test('should pack given directory', async t => {
  const testDir = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-cool-pkg',
      version: '1.0.0',
    }, null, 2),
  })

  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => cb(),
    },
  })
  const npm = mockNpm({
    config: {
      unicode: true,
      json: false,
      'dry-run': true,
    },
    output,
  })
  const pack = new Pack(npm)

  await pack.exec([testDir])

  const filename = 'my-cool-pkg-1.0.0.tgz'
  t.strictSame(OUTPUT, [[filename]])
})

t.test('should pack given directory for scoped package', async t => {
  const testDir = t.testdir({
    'package.json': JSON.stringify({
      name: '@cool/my-pkg',
      version: '1.0.0',
    }, null, 2),
  })

  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => cb(),
    },
  })
  const npm = mockNpm({
    config: {
      unicode: true,
      json: false,
      'dry-run': true,
    },
    output,
  })
  const pack = new Pack(npm)

  await pack.exec([testDir])

  const filename = 'cool-my-pkg-1.0.0.tgz'
  t.strictSame(OUTPUT, [[filename]])
})

t.test('should log pack contents', async t => {
  const Pack = t.mock('../../../lib/commands/pack.js', {
    '../../../lib/utils/tar.js': {
      ...require('../../../lib/utils/tar.js'),
      logTar: () => {
        t.ok(true, 'logTar is called')
      },
    },
    libnpmpack,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => cb(),
    },
  })
  const npm = mockNpm({
    config: {
      unicode: false,
      json: false,
      'dry-run': false,
    },
    output,
  })
  const pack = new Pack(npm)

  await pack.exec([])

  const filename = `npm-${require('../../../package.json').version}.tgz`
  t.strictSame(OUTPUT, [[filename]])
})

t.test('should log output as valid json', async t => {
  const testDir = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-cool-pkg',
      version: '1.0.0',
      main: './index.js',
    }, null, 2),
    'README.md': 'text',
    'index.js': 'void',
  })

  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    '../../../lib/utils/tar.js': {
      getContents: async () => ({
        id: '@ruyadorno/redact@1.0.0',
        name: '@ruyadorno/redact',
        version: '1.0.0',
        size: 2450,
        unpackedSize: 4911,
        shasum: '044c7574639b923076069d6e801e2d1866430f17',
        // mocks exactly how ssri Integrity works:
        integrity: {
          sha512: [
            {
              source: 'sha512-JSdyskeR2qonBUaQ4vdlU/vQGSfgCxSq5O+vH+d2yVWRqzso4O3gUzd6QX/V7OWV//zU7kA5o63Zf433jUnOtQ==',
              digest: 'JSdyskeR2qonBUaQ4vdlU/vQGSfgCxSq5O+vH+d2yVWRqzso4O3gUzd6QX/V7OWV//zU7kA5o63Zf433jUnOtQ==',
              algorithm: 'sha512',
              options: [],
            },
          ],
          toJSON () {
            return 'sha512-JSdyskeR2qonBUaQ4vdlU/vQGSfgCxSq5O+vH+d2yVWRqzso4O3gUzd6QX/V7OWV//zU7kA5o63Zf433jUnOtQ=='
          },
        },
        filename: '@ruyadorno/redact-1.0.0.tgz',
        files: [
          { path: 'LICENSE', size: 1113, mode: 420 },
          { path: 'README.md', size: 2639, mode: 420 },
          { path: 'index.js', size: 719, mode: 493 },
          { path: 'package.json', size: 440, mode: 420 },
        ],
        entryCount: 4,
        bundled: [],
      }),
    },
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => cb(),
    },
  })
  const npm = mockNpm({
    config: {
      unicode: true,
      json: true,
      'dry-run': true,
    },
    output,
  })
  const pack = new Pack(npm)

  await pack.exec([testDir])

  t.match(JSON.parse(OUTPUT), [{
    id: '@ruyadorno/redact@1.0.0',
    name: '@ruyadorno/redact',
    version: '1.0.0',
    size: 2450,
    unpackedSize: 4911,
    shasum: '044c7574639b923076069d6e801e2d1866430f17',
    integrity: 'sha512-JSdyskeR2qonBUaQ4vdlU/vQGSfgCxSq5O+vH+d2yVWRqzso4O3gUzd6QX/V7OWV//zU7kA5o63Zf433jUnOtQ==',
    filename: '@ruyadorno/redact-1.0.0.tgz',
    files: [
      { path: 'LICENSE' },
      { path: 'README.md' },
      { path: 'index.js' },
      { path: 'package.json' },
    ],
    entryCount: 4,
  }], 'pack details output as valid json')
})

t.test('invalid packument', async t => {
  const mockPacote = {
    manifest: () => {
      return {}
    },
  }
  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    pacote: mockPacote,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => cb(),
    },
  })
  const npm = mockNpm({
    config: {
      unicode: true,
      json: false,
      'dry-run': true,
    },
    output,
  })
  const pack = new Pack(npm)
  await t.rejects(
    pack.exec([]),
    'Invalid package, must have name and version'
  )
  t.strictSame(OUTPUT, [])
})

t.test('workspaces', (t) => {
  const testDir = t.testdir({
    'package.json': JSON.stringify({
      name: 'workspaces-test',
      version: '1.0.0',
      workspaces: ['workspace-a', 'workspace-b'],
    }, null, 2),
    'workspace-a': {
      'package.json': JSON.stringify({
        name: 'workspace-a',
        version: '1.0.0',
      }),
    },
    'workspace-b': {
      'package.json': JSON.stringify({
        name: 'workspace-b',
        version: '1.0.0',
      }),
    },
  })
  const Pack = t.mock('../../../lib/commands/pack.js', {
    libnpmpack,
    pacote: mockPacote,
    npmlog: {
      notice: () => {},
      showProgress: () => {},
      clearProgress: () => {},
    },
    fs: {
      writeFile: (file, data, cb) => cb(),
    },
  })
  const npm = mockNpm({
    localPrefix: testDir,
    config: {
      unicode: false,
      json: false,
      'dry-run': false,
    },
    output,
  })
  const pack = new Pack(npm)

  t.test('all workspaces', async t => {
    await pack.execWorkspaces([], [])

    t.strictSame(OUTPUT, [
      ['workspace-a-1.0.0.tgz'],
      ['workspace-b-1.0.0.tgz'],
    ])
  })

  t.test('all workspaces, `.` first arg', async t => {
    await pack.execWorkspaces(['.'], [])

    t.strictSame(OUTPUT, [
      ['workspace-a-1.0.0.tgz'],
      ['workspace-b-1.0.0.tgz'],
    ])
  })

  t.test('one workspace', async t => {
    await pack.execWorkspaces([], ['workspace-a'])

    t.strictSame(OUTPUT, [
      ['workspace-a-1.0.0.tgz'],
    ])
  })

  t.test('specific package', async t => {
    await pack.execWorkspaces(['abbrev'], [])

    t.strictSame(OUTPUT, [
      ['abbrev-1.0.0-test.tgz'],
    ])
  })
  t.end()
})
