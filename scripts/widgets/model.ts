/**
 * Model widget - displays current Claude model name with effort level
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { Widget } from './base.js';
import type { WidgetContext, ModelData, EffortLevel } from '../types.js';
import { COLORS, RESET } from '../utils/colors.js';
import { shortenModelName } from '../utils/formatters.js';
import { isZaiProvider } from '../utils/provider.js';

const VALID_NON_DEFAULT_EFFORTS = new Set<EffortLevel>(['medium', 'low']);

function isNonDefaultEffort(value: unknown): value is EffortLevel {
  return VALID_NON_DEFAULT_EFFORTS.has(value as EffortLevel);
}

async function getEffortLevel(): Promise<EffortLevel> {
  // 1. settings.json
  try {
    const settingsPath = join(homedir(), '.claude', 'settings.json');
    const content = await readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    if (isNonDefaultEffort(settings.effortLevel)) {
      return settings.effortLevel;
    }
  } catch { /* file may not exist */ }

  // 2. Environment variable
  const envEffort = process.env.CLAUDE_CODE_EFFORT_LEVEL;
  if (isNonDefaultEffort(envEffort)) {
    return envEffort;
  }

  // 3. Default
  return 'high';
}

export const modelWidget: Widget<ModelData> = {
  id: 'model',
  name: 'Model',

  async getData(ctx: WidgetContext): Promise<ModelData | null> {
    const { model } = ctx.stdin;
    const effortLevel = await getEffortLevel();

    return {
      id: model?.id || '',
      displayName: model?.display_name || '-',
      effortLevel,
    };
  },

  render(data: ModelData): string {
    const shortName = shortenModelName(data.displayName);
    const icon = isZaiProvider() ? '🟠' : '🤖';

    // Show effort suffix for Opus: (H), (M), (L)
    const effortSuffix = data.effortLevel && shortName === 'Opus'
      ? `(${data.effortLevel[0].toUpperCase()})`
      : '';

    return `${COLORS.pastelCyan}${icon} ${shortName}${effortSuffix}${RESET}`;
  },
};
