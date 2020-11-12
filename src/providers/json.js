const { Provider, util } = require('swift');
const { resolve } = require('path');
const fs = require('fs-nextra');

module.exports = class extends Provider {
	constructor(...args) {
		super(...args);

		const baseDirectory = resolve(this.client.userBaseDirectory, 'bwd', 'provider', 'json');
		const defaults = util.mergeDefault({ baseDirectory }, this.client.options.providers.json);
		this.baseDirectory = defaults.baseDirectory;
	}

	async init() {
		await fs.ensureDir(this.baseDirectory).catch(err => this.client.emit('error', err));
	}

	hasTable(table) {
		return fs.pathExists(resolve(this.baseDirectory, table));
	}

	createTable(table) {
		return fs.mkdir(resolve(this.baseDirectory, table));
	}

	deleteTable(table) {
		return this.hasTable(table)
			.then(exists => exists ? fs.emptyDir(resolve(this.baseDirectory, table)).then(() => fs.remove(resolve(this.baseDirectory, table))) : null);
	}

	async getAll(table, entries) {
		if (!Array.isArray(entries) || !entries.length) entries = await this.getKeys(table);
		if (entries.length < 5000) {
			return Promise.all(entries.map(this.get.bind(this, table)));
		}

		const chunks = util.chunk(entries, 5000);
		const output = [];
		for (const chunk of chunks) output.push(...await Promise.all(chunk.map(this.get.bind(this, table))));
		return output;
	}

	async getKeys(table) {
		const dir = resolve(this.baseDirectory, table);
		const filenames = await fs.readdir(dir);
		const files = [];
		for (const filename of filenames) {
			if (filename.endsWith('.json')) files.push(filename.slice(0, filename.length - 5));
		}
		return files;
	}

	get(table, id) {
		return fs.readJSON(resolve(this.baseDirectory, table, `${id}.json`)).catch(() => null);
	}

	has(table, id) {
		return fs.pathExists(resolve(this.baseDirectory, table, `${id}.json`));
	}

	getRandom(table) {
		return this.getKeys(table).then(data => this.get(table, data[Math.floor(Math.random() * data.length)]));
	}

	create(table, id, data = {}) {
		return fs.outputJSONAtomic(resolve(this.baseDirectory, table, `${id}.json`), { id, ...this.parseUpdateInput(data) });
	}

	async update(table, id, data) {
		const existent = await this.get(table, id);
		return fs.outputJSONAtomic(resolve(this.baseDirectory, table, `${id}.json`), util.mergeObjects(existent || { id }, this.parseUpdateInput(data)));
	}
  
	replace(table, id, data) {
		return fs.outputJSONAtomic(resolve(this.baseDirectory, table, `${id}.json`), { id, ...this.parseUpdateInput(data) });
	}

	delete(table, id) {
		return fs.unlink(resolve(this.baseDirectory, table, `${id}.json`));
	}

};
