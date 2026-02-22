/**
 * Project info widget - displays directory name, git branch, and ahead/behind status
 */

import { execFileSync } from 'child_process';
import { basename } from 'path';
import type { Widget } from './base.js';
import type { WidgetContext, ProjectInfoData } from '../types.js';
import { colorize, getTheme } from '../utils/colors.js';

/**
 * Get current git branch with timeout
 */
function getGitBranch(cwd: string): string | undefined {
  try {
    const result = execFileSync('git', ['--no-optional-locks', 'rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf-8',
      timeout: 500, // 500ms timeout to prevent blocking
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim() || undefined;
  } catch {
    // Not a git repo or git not available
    return undefined;
  }
}

/**
 * Check if git working directory has uncommitted changes
 */
function isGitDirty(cwd: string): boolean {
  try {
    const result = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], {
      cwd,
      encoding: 'utf-8',
      timeout: 1000, // 1s timeout
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Get ahead/behind counts relative to upstream
 * Returns { ahead, behind } or null if no upstream
 */
function getAheadBehind(cwd: string): { ahead: number; behind: number } | null {
  try {
    const result = execFileSync(
      'git',
      ['--no-optional-locks', 'rev-list', '--left-right', '--count', '@{u}...HEAD'],
      {
        cwd,
        encoding: 'utf-8',
        timeout: 500,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    const parts = result.trim().split(/\s+/);
    if (parts.length === 2) {
      return {
        behind: parseInt(parts[0], 10) || 0,
        ahead: parseInt(parts[1], 10) || 0,
      };
    }
    return null;
  } catch {
    // No upstream configured or git error
    return null;
  }
}

export const projectInfoWidget: Widget<ProjectInfoData> = {
  id: 'projectInfo',
  name: 'Project Info',

  async getData(ctx: WidgetContext): Promise<ProjectInfoData | null> {
    const currentDir = ctx.stdin.workspace?.current_dir;
    if (!currentDir) {
      return null;
    }

    const dirName = basename(currentDir);
    const branch = getGitBranch(currentDir);

    // Add * suffix if there are uncommitted changes
    let gitBranch: string | undefined;
    let ahead: number | undefined;
    let behind: number | undefined;

    if (branch) {
      const dirty = isGitDirty(currentDir);
      gitBranch = dirty ? `${branch}*` : branch;

      const ab = getAheadBehind(currentDir);
      if (ab) {
        ahead = ab.ahead;
        behind = ab.behind;
      }
    }

    return {
      dirName,
      gitBranch,
      ahead,
      behind,
    };
  },

  render(data: ProjectInfoData): string {
    const theme = getTheme();
    const parts: string[] = [];

    // Directory name with folder icon
    parts.push(colorize(`📁 ${data.dirName}`, theme.folder));

    // Git branch in parentheses with ahead/behind indicators
    if (data.gitBranch) {
      let branchStr = data.gitBranch;

      const aheadStr = (data.ahead ?? 0) > 0 ? `↑${data.ahead}` : '';
      const behindStr = (data.behind ?? 0) > 0 ? `↓${data.behind}` : '';
      const indicators = `${aheadStr}${behindStr}`;

      if (indicators) {
        branchStr += ` ${indicators}`;
      }

      parts.push(colorize(`(${branchStr})`, theme.branch));
    }

    return parts.join(' ');
  },
};
