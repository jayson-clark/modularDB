import express from 'express';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

class Plugin {
    /**
     * Creates an instance of the Plugin class.
     * @param {Object} app - The Express application.
     * @param {Object} db - The database connection.
     * @param {string} id - The plugin ID.
     * @param {string} rootPath - The root path of the plugin.
     */
    constructor(app, db, id, rootPath) {
        this.app = app;
        this.db = db;
        this.id = id;
        this.rootPath = rootPath;

        const manifestPath = join(this.rootPath, 'manifest.json');
        this.manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

        this.router = express.Router();
        this.app.use(`/api/${this.id}`, this.router);
    }

    /**
     * Loads routes from the specified directory.
     * @param {string} directory - The directory to load routes from.
     */
    async loadRoutes(directory) {
        const files = readdirSync(directory);

        for (const file of files) {
            const fullPath = join(directory, file);

            if (statSync(fullPath).isDirectory()) {
                await this.loadRoutes(fullPath);
            } else if (file.endsWith('.js')) {
                const fileUrl = pathToFileURL(fullPath).href;
                const { default: route } = await import(fileUrl);
                route(this);
            }
        }
    }

    /**
      * Setup the database tables for the plugin.
      * This method should be overridden by the plugin if it needs to create database tables.
      */
    setupDatabase() { }

    /**
     * Teardown the database tables for the plugin.
     * This method should be overridden by the plugin if it needs to drop database tables.
     */
    teardownDatabase() { }

    /**
     * Initializes the plugin.
     */
    init() {
        this.setupDatabase();

        const routesDir = join(this.rootPath, 'routes');
        if (existsSync(routesDir)) {
            this.loadRoutes(routesDir);
        }
    }
}

export default Plugin;
