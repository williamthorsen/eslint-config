import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: { dataset: process.env.SANITY_DATASET, projectId: process.env.SANITY_PROJECT_ID },
});
