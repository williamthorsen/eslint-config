import type { ESLint } from 'eslint';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
type Plugin = ESLint.Plugin;

const mapping = {
  // '@atlaskit/design-system': fixupPluginRules(adsDesignSystemPlugin),
  // '@atlaskit/ui-styling-standard': fixupPluginRules(adsUiStylingStandardPlugin),
  // '@compiled': compiledPlugin,
  // '@stylistic': stylisticPlugin,
  'eslint-comments': eslintCommentsPlugin,
  // 'import': importPlugin,
  // 'jest': jestPlugin,
  // 'jest-dom': jestDomPlugin,
  // 'jsx-a11y': jsxA11yPlugin,
  // 'playwright': playwrightPlugin,
  // 'prettier': prettierPlugin,
  // 'promise': promisePlugin,
  // 'react': reactPlugin,
  // 'react-hooks': reactHooksPlugin,
  'simple-import-sort': simpleImportSortPlugin,
  // 'sky-pilot': skyPilotPlugin,
  // 'styled-components-a11y': styledComponentsA11yPlugin,
  // 'testing-library': testingLibraryPlugin,
  // 'unicorn': unicornLibraryPlugin,
};

type PluginName = keyof typeof mapping;

/**
 * Function that takes an array of plugin names and returns an object,
 * where each key is a plugin name and the corresponding value is the plugin itself.
 *
 * @param {string[]} pluginNames - An array of plugin names.
 * @returns PluginMapping - An object with plugin names as keys and plugins as values.
 * The types of the plugins are unknown, so they are represented as `any`.
 */
export function mapPlugins(pluginNames: ReadonlyArray<PluginName>) {
  return pluginNames.reduce<Record<string, Plugin>>((acc, pluginName) => {
    const plugin = mapping[pluginName];
    if (!plugin) {
      throw new Error(`No mapping for plugin "${pluginName}": ${JSON.stringify(plugin)}`);
    }
    acc[pluginName] = mapping[pluginName];
    return acc;
  }, {});
}
