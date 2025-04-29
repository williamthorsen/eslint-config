import type { Linter } from 'eslint';
import type { ConfigArray } from 'typescript-eslint';

export interface OptionalConfig {
  config: MaybeFactory<ConfigArray | Linter.Config>;
  dependencies: string[];
}

/**
 * Returns the config array if all dependencies are installed, otherwise returns undefined.
 */
export async function resolveOptionalConfigs(optionalConfigs: readonly OptionalConfig[]): Promise<ConfigArray> {
  const resolvedConfigs = await Promise.all(
    optionalConfigs.map(async ({ config, dependencies }) => {
      try {
        await Promise.all(dependencies.map((dependency) => import(dependency)));
        return typeof config === 'function' ? await config() : config;
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          'code' in error &&
          (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'MODULE_NOT_FOUND')
        ) {
          return [];
        }
        throw error;
      }
    }),
  );

  return resolvedConfigs.flat();
}

type MaybeFactory<T> = T | (() => T | Promise<T>);
