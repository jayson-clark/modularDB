import Plugin from '../../lib/PluginBase.js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * LayoutPlugin Class
 * 
 * This class extends the PluginBase to manage saving and loading widget layout configurations.
 */
class LayoutPlugin extends Plugin {
    /**
     * Constructor for the LayoutPlugin class
     * 
     * @param {Object} app - The Express application instance
     * @param {Object} db - The database connection instance
     * @param {string} id - The unique identifier for the plugin
     * @param {string} rootPath - The root path of the plugin
     */
    constructor(app, db, id, rootPath) {
        super(app, db, id, rootPath);
        this.layoutFilePath = join(this.rootPath, 'layout.json');
    }

    /**
     * Save layout to a JSON file
     * 
     * @param {Array} layout - The layout configuration to be saved
     */
    saveLayout(layout) {
        writeFileSync(this.layoutFilePath, JSON.stringify(layout, null, 2));
    }

    /**
     * Load layout from a JSON file
     * 
     * @returns {Array} - The layout configuration loaded from the file, or an empty array if the file doesn't exist
     */
    loadLayout() {
        if (existsSync(this.layoutFilePath)) {
            const layout = readFileSync(this.layoutFilePath, 'utf-8');
            return JSON.parse(layout);
        }
        return [];
    }
}

export default LayoutPlugin;
