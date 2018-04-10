const { execSync } = require('child_process')
const { copyFileSync, readdirSync, existsSync, readFileSync, writeFileSync } = require('fs')
const mkdirp = require('mkdirp')
const { platform, tmpdir, arch } = require('os')
const { join } = require('path')
const rimraf = require('rimraf')
const binDir = require('./index')

const tmp = join(tmpdir(), 'ss-redir-service-tmp')
const osType = platform()
const cpuArch = arch()
const assertDir = join(__dirname, './assets')

if (osType === 'linux') {
	console.log('> Installing ...')
	compileShadowsocks()
	compileHevDnsForwarder()
	console.log('> Install succeed')
} else {
	console.log(`> Current os ${osType} is not supported, skip install`)
}

/*********************************************** shadowsocks *********************************************/

function compileShadowsocks() {
	console.log('> Compiling shadowsocks-libev ...')
	const ssPackageFile = findSSPackage()
	rimraf.sync(tmp)
	mkdirp.sync(tmp)
	execSync(`tar zxf ${ssPackageFile} -C ${tmp}`)
	const exractDir = findSSExtractDir()
	execSync('./configure --disable-documentation', {
		cwd: exractDir,
		stdio: 'inherit'
	})
	execSync('make', {
		cwd: exractDir,
		stdio: 'inherit'
	})
	copySSBinary(exractDir)
	rimraf.sync(tmp)
}

function findSSPackage() {
	const dir = assertDir
	const files = readdirSync(dir)
	for (const f of files) {
		if (f.match(/^shadowsocks-libev(.*).tar.gz$/)) {
			return join(dir, f)
		}
	}
	throw new Error('Could not find shadowsocks-libev-{version}.tar.gz in assets')
}

function findSSExtractDir() {
	const files = readdirSync(tmp)
	for (const f of files) {
		if (f.match(/^shadowsocks-libev/)) {
			return join(tmp, f)
		}
	}
	throw new Error('Could not find extracted shadowsocks-libev in temp directory')
}

function copySSBinary(exractDir) {
	const ssNAT = join(exractDir, 'src/ss-nat')
	const ssRedir = join(exractDir, 'src/ss-redir')
	const ssTunnel = join(exractDir, 'src/ss-tunnel')
	const targetDir = binDir
	copyFileSync(ssNAT, join(targetDir, 'ss-nat'))
	copyFileSync(ssRedir, join(targetDir, 'ss-redir'))
	copyFileSync(ssTunnel, join(targetDir, 'ss-tunnel'))
}

/*********************************************** hev-dns-forwarder *********************************************/

function compileHevDnsForwarder() {
	console.log('> Compiling hev-dns-forwarder ...')
	const hevDnsForwarderPackageFile = join(assertDir, 'hev-dns-forwarder.tar.gz')
	rimraf.sync(tmp)
	mkdirp.sync(tmp)
	execSync(`tar zxf ${hevDnsForwarderPackageFile} -C ${tmp}`)
	const exractDir = join(tmp, 'hev-dns-forwarder')
	execSync('make', {
		cwd: exractDir,
		stdio: 'inherit'
	})
	copyFileSync(join(exractDir, 'src', 'hev-dns-forwarder'), join(binDir, 'hev-dns-forwarder'))
	rimraf.sync(tmp)
}
