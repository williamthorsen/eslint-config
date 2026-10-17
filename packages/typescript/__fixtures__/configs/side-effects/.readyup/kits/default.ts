import { defineRdyKit } from 'readyup';

import { buildChecks } from './checks/build-checks.ts';

export default defineRdyKit({ checklists: [{ name: (1).toLocaleString(), checks: buildChecks() }] });
