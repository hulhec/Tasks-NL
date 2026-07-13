import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

const configDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
	globalIgnores([
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
		'eslint.config.mts',
		'manifest.json',
		'globalIgnores.json',
	]),

	...obsidianmd.configs.recommended,

	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir: configDirectory,
			},
		},
		rules: {
			'obsidianmd/ui/sentence-case': 'off',
		},
	},

	{
		files: [
			'src/main.ts',
			'src/services/TaskCreationService.ts',
			'src/settings.ts',
		],
		rules: {
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'obsidianmd/ui/sentence-case': 'off',
			'obsidianmd/settings-tab/prefer-setting-definitions': 'off',
		},
	},
);
