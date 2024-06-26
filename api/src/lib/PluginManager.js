
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { __dirname } from './utils.js';
import { pathToFileURL } from 'url';

class PluginManager {
    /**
     * Creates an instance of the PluginManager class.
     * @param {Object} app - The Express application.
     * @param {Object} db - The database connection.
     */
    constructor(app, db) {
        this.app = app;
        this.db = db;
        this.plugins = new Map();
        this.pluginsPath = join(__dirname, '..', 'plugins');
    }

    /**
     * Loads a plugin from the specified directory.
     * @param {string} pluginDir - The directory of the plugin.
     */
    async loadPlugin(pluginDir) {
        try {
            const manifestPath = join(this.pluginsPath, pluginDir, 'manifest.json');
            if (!existsSync(manifestPath)) {
                throw new Error(`Manifest file not found for plugin ${pluginDir}`);
            }

            const pluginPath = join(this.pluginsPath, pluginDir);

            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
            const mainFile = manifest.main;
            const mainFilePath = join(pluginPath, mainFile);

            const mainFileUrl = pathToFileURL(mainFilePath).href;
            const { default: Plugin } = await import(mainFileUrl);

            const pluginInstance = new Plugin(this.app, this.db, pluginDir, pluginPath);
            pluginInstance.init();
            this.plugins.set(pluginDir, pluginInstance);

            console.log(`Loaded plugin: ${pluginDir}`);
        } catch (err) {
            console.error(`Error loading plugin ${pluginDir}:`, err);
        }
    }

    /**
     * Unloads a plugin.
     * @param {string} pluginDir - The directory of the plugin.
     */
    unloadPlugin(pluginDir) {
        if (this.plugins.has(pluginDir)) {
            const pluginInstance = this.plugins.get(pluginDir);

            pluginInstance.teardownDatabase();
            this.plugins.delete(pluginDir);
            delete require.cache[require.resolve(join(this.pluginsPath, pluginDir, 'manifest.json'))];

            console.log(`Unloaded plugin: ${pluginDir}`);
        } else {
            console.error(`Plugin ${pluginDir} not found`);
        }
    }

    /**
     * Reloads a plugin by unloading and then loading it again.
     * @param {string} pluginDir - The directory of the plugin.
     */
    reloadPlugin(pluginDir) {
        this.unloadPlugin(pluginDir);
        this.loadPlugin(pluginDir);
    }

    /**
     * Lists all loaded plugins.
     * @returns {Array<string>} - An array of loaded plugin directories.
     */
    listPlugins() {
        return Array.from(this.plugins.keys());
    }

    /**
     * Initializes the plugin manager by loading all plugins.
     */
    init() {
        const pluginDirs = readdirSync(this.pluginsPath).filter(file => {
            return statSync(join(this.pluginsPath, file)).isDirectory();
        });

        pluginDirs.forEach(dir => this.loadPlugin(dir));
    }
}

export default PluginManager;
