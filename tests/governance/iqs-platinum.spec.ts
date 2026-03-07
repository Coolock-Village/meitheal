/**
 * IQS Platinum Compliance — E2E Governance Test
 *
 * Ensures the Meitheal HA custom component maintains at minimum
 * Platinum tier on the HA Integration Quality Scale (IQS).
 *
 * @see https://developers.home-assistant.io/docs/core/integration-quality-scale/checklist
 *
 * This test runs on every CI push to prevent regression.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const repoRoot = path.join(process.cwd(), '..');
const COMPONENT_DIR = path.join(
  repoRoot,
  'integrations/home-assistant/custom_components/meitheal',
);

function readJSON(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(COMPONENT_DIR, filename), 'utf-8'));
}

function fileExists(filename: string) {
  return fs.existsSync(path.join(COMPONENT_DIR, filename));
}

function readPython(filename: string) {
  return fs.readFileSync(path.join(COMPONENT_DIR, filename), 'utf-8');
}

// ─── Bronze ──────────────────────────────────────────────────────────────────

test.describe('IQS Bronze', () => {
  test('config-flow: manifest declares config_flow', () => {
    const manifest = readJSON('manifest.json');
    expect(manifest.config_flow).toBe(true);
  });

  test('unique-config-entry: manifest declares single_config_entry', () => {
    const manifest = readJSON('manifest.json');
    expect(manifest.single_config_entry).toBe(true);
  });

  test('has-entity-name: all entities set _attr_has_entity_name', () => {
    for (const file of ['sensor.py', 'todo.py']) {
      const src = readPython(file);
      expect(src).toContain('_attr_has_entity_name = True');
    }
  });

  test('entity-unique-id: all entities set _attr_unique_id', () => {
    for (const file of ['sensor.py', 'todo.py']) {
      const src = readPython(file);
      expect(src).toContain('_attr_unique_id');
    }
  });

  test('runtime-data: no Python file uses hass.data[DOMAIN] for coordinator lookup', () => {
    // This catches the bug where intents.py and llm_api.py were silently broken
    for (const file of ['__init__.py', 'sensor.py', 'todo.py', 'diagnostics.py', 'intents.py', 'llm_api.py']) {
      const src = readPython(file);
      expect(src).not.toContain('hass.data[DOMAIN]');
      expect(src).not.toContain('hass.data.get(DOMAIN');
    }
  });

  test('action-setup: services registered in async_setup_entry', () => {
    const init = readPython('__init__.py');
    expect(init).toContain('hass.services.async_register');
  });

  test('test-before-setup: uses async_config_entry_first_refresh', () => {
    const init = readPython('__init__.py');
    expect(init).toContain('async_config_entry_first_refresh');
  });

  test('common-modules: helpers.py exists with shared device_info', () => {
    expect(fileExists('helpers.py')).toBe(true);
    const helpers = readPython('helpers.py');
    expect(helpers).toContain('def device_info');
    expect(helpers).toContain('PARALLEL_UPDATES');
  });

  test('dependency-transparency: manifest has requirements array', () => {
    const manifest = readJSON('manifest.json');
    expect(Array.isArray(manifest.requirements)).toBe(true);
  });

  test('config-flow data_description: user step has data_description', () => {
    const strings = readJSON('strings.json');
    expect(strings.config.step.user.data_description).toBeDefined();
  });
});

// ─── Silver ──────────────────────────────────────────────────────────────────

test.describe('IQS Silver', () => {
  test('action-exceptions: uses translation_key in HomeAssistantError', () => {
    const init = readPython('__init__.py');
    expect(init).toContain('translation_key=');
    expect(init).toContain('translation_domain=');
  });

  test('config-entry-unloading: async_unload_entry implemented', () => {
    const init = readPython('__init__.py');
    expect(init).toContain('async_unload_entry');
    expect(init).toContain('async_unload_platforms');
  });

  test('parallel-updates: PARALLEL_UPDATES defined in platform modules', () => {
    for (const file of ['sensor.py', 'todo.py']) {
      const src = readPython(file);
      expect(src).toContain('PARALLEL_UPDATES');
    }
  });

  test('integration-owner: manifest has codeowners', () => {
    const manifest = readJSON('manifest.json');
    expect(manifest.codeowners.length).toBeGreaterThan(0);
  });

  test('log-when-unavailable: coordinator logs availability transitions', () => {
    const coord = readPython('coordinator.py');
    expect(coord).toContain('_was_available');
    expect(coord).toContain('is available again');
    expect(coord).toContain('is unavailable at');
  });
});

// ─── Gold ────────────────────────────────────────────────────────────────────

test.describe('IQS Gold', () => {
  test('devices: device registered in __init__.py', () => {
    const init = readPython('__init__.py');
    expect(init).toContain('async_get_or_create');
    expect(init).toContain('meitheal_hub');
  });

  test('diagnostics: diagnostics.py exists', () => {
    expect(fileExists('diagnostics.py')).toBe(true);
    const diag = readPython('diagnostics.py');
    expect(diag).toContain('async_get_config_entry_diagnostics');
  });

  test('discovery: manifest depends on hassio', () => {
    const manifest = readJSON('manifest.json');
    expect(manifest.dependencies).toContain('hassio');
  });

  test('entity-category: sensors use EntityCategory', () => {
    const sensor = readPython('sensor.py');
    expect(sensor).toContain('EntityCategory.DIAGNOSTIC');
  });

  test('entity-disabled-by-default: total_tasks disabled by default', () => {
    const sensor = readPython('sensor.py');
    expect(sensor).toContain('entity_registry_enabled_default = False');
  });

  test('entity-translations: strings.json has entity translations', () => {
    const strings = readJSON('strings.json');
    expect(strings.entity.sensor.active_tasks.name).toBeDefined();
    expect(strings.entity.todo.task_list.name).toBeDefined();
  });

  test('exception-translations: strings.json has exception translations', () => {
    const strings = readJSON('strings.json');
    expect(strings.exceptions.create_failed.message).toBeDefined();
    expect(strings.exceptions.addon_unavailable.message).toBeDefined();
  });

  test('icon-translations: icons.json exists', () => {
    expect(fileExists('icons.json')).toBe(true);
    const icons = readJSON('icons.json');
    expect(icons.entity.sensor.active_tasks.default).toBeDefined();
    expect(icons.services.create_task.service).toBeDefined();
  });

  test('reconfiguration-flow: config_flow has async_step_reconfigure', () => {
    const flow = readPython('config_flow.py');
    expect(flow).toContain('async_step_reconfigure');
  });

  test('repair-issues: repairs.py exists with issue creation', () => {
    expect(fileExists('repairs.py')).toBe(true);
    const repairs = readPython('repairs.py');
    expect(repairs).toContain('async_create_issue');
    expect(repairs).toContain('async_delete_issue');
  });

  test('reconfiguration strings: strings.json has reconfigure step', () => {
    const strings = readJSON('strings.json');
    expect(strings.config.step.reconfigure).toBeDefined();
    expect(strings.config.step.reconfigure.data.host).toBeDefined();
  });

  test('repair issue strings: strings.json has issues section', () => {
    const strings = readJSON('strings.json');
    expect(strings.issues.addon_unreachable.title).toBeDefined();
  });
});

// ─── Platinum ────────────────────────────────────────────────────────────────

test.describe('IQS Platinum', () => {
  test('async-dependency: uses aiohttp (async)', () => {
    const coord = readPython('coordinator.py');
    expect(coord).toContain('import aiohttp');
  });

  test('inject-websession: uses async_get_clientsession', () => {
    const coord = readPython('coordinator.py');
    expect(coord).toContain('async_get_clientsession');
  });

  test('strict-typing: py.typed marker exists', () => {
    expect(fileExists('py.typed')).toBe(true);
  });

  test('quality_scale: manifest declares platinum', () => {
    const manifest = readJSON('manifest.json');
    expect(manifest.quality_scale).toBe('platinum');
  });

  test('backup-platform: backup.py implements pre/post hooks', () => {
    expect(fileExists('backup.py')).toBe(true);
    const src = readPython('backup.py');
    expect(src).toContain('async def async_pre_backup');
    expect(src).toContain('async def async_post_backup');
    expect(src).toContain('hass: HomeAssistant');
  });
});
