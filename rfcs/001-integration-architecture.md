# RFC 001: Integration Architecture for Auto-Claude

**Status:** Draft
**Author:** @bbopen
**Created:** 2026-01-05
**Discussion:** (PR link)

---

## Summary

This RFC proposes a plugin/integration architecture for Auto-Claude that enables deep integrations (like spec-driven development frameworks, issue trackers, and external services) to be developed and maintained independently from the core application.

## Motivation

### The Growing Need for Integrations

Auto-Claude's value proposition—autonomous AI-assisted development—becomes more powerful when integrated with the tools developers already use:

- **Issue Trackers:** GitHub Issues, GitLab Issues, Linear, Jira, Notion
- **Spec-Driven Frameworks:** Spec-Kit, custom methodologies, company-specific workflows
- **CI/CD:** GitHub Actions, GitLab CI, Jenkins
- **Communication:** Slack, Discord, Microsoft Teams
- **Documentation:** Confluence, Notion, README sync

Currently, Auto-Claude has some integrations (GitHub, GitLab, Linear) that are tightly coupled into the core codebase. Adding new integrations or modifying existing ones requires changes across 30+ core files.

### Spec-Driven Development is Complementary

Frameworks like **Spec-Kit** (8-phase spec-driven development) are *complementary* to Auto-Claude, not competitive:

- Auto-Claude provides the **execution engine** (Claude AI, task management, file operations)
- Spec-Kit provides the **methodology** (phases, constitution, structured artifacts)

Other spec-driven frameworks will emerge:
- Company-specific development workflows
- Domain-specific methodologies (security-first, accessibility-first)
- Compliance-driven development (SOC2, HIPAA, GDPR workflows)
- Educational frameworks for teaching software development

These should all be able to integrate with Auto-Claude without forking the codebase.

### Current Pain Points

| Issue | Impact |
|-------|--------|
| Adding Spec-Kit required modifying ~36 core files | High maintenance burden |
| No isolation between integrations | One integration's bug can crash the app |
| No versioning | Integrations update with core releases only |
| No discovery mechanism | Cannot install/uninstall integrations |
| Tight coupling | Integration types mixed with core types |
| No activation control | Integrations always load, even when disabled |

## Proposed Solution

### Design Principles

1. **Manifest-Driven:** Integrations declare their capabilities via typed manifests
2. **Extension Points, Not Hooks:** Clear contracts at architectural boundaries
3. **Lazy Loading:** Integrations load on-demand based on activation events
4. **Isolation:** Integration failures don't crash the core app
5. **Type Safety:** Strong TypeScript contracts between core and integrations
6. **Process-Aware:** Respects Electron's main/renderer split and Python backend

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-CLAUDE CORE                         │
├─────────────────────────────────────────────────────────────┤
│  Extension Host (Main)  │  Extension Host (Renderer)  │ Py │
│  - IPC registration     │  - Nav contributions        │    │
│  - Permission checks    │  - View loading (lazy)      │    │
│  - Python bridge        │  - Settings merger          │    │
└────────────┬────────────┴──────────────┬──────────────┴──┬─┘
             │                           │                 │
             ▼                           ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION REGISTRY                       │
│  Discovers: /integrations/*/manifest.json                   │
│  Activates based on: project settings, activation events    │
└─────────────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬─────────────────┬─────────────────┐
    ▼                 ▼                 ▼                 ▼
┌──────────┐   ┌──────────┐      ┌──────────┐      ┌──────────┐
│ speckit/ │   │ github/  │      │ gitlab/  │      │ linear/  │
│          │   │          │      │          │      │          │
└──────────┘   └──────────┘      └──────────┘      └──────────┘
```

### Extension Points

Integrations can contribute to these well-defined extension points:

#### 1. Settings Contribution

Integrations declare settings schemas that get merged into project/global settings:

```typescript
interface SettingsContribution {
  project?: SettingsSchemaNode[];    // Project-level settings
  projectEnv?: EnvSettingsSchema[];  // Environment settings (.env)
  global?: SettingsSchemaNode[];     // Global app settings
}

// Example: Spec-Kit settings
{
  project: [
    { key: 'specKitEnabled', type: 'boolean', default: false },
    { key: 'specKitPhaseModels', type: 'object', when: '$.specKitEnabled' }
  ]
}
```

#### 2. Navigation Contribution

Integrations add sidebar items with conditional visibility:

```typescript
interface NavigationContribution {
  id: string;
  labelKey: string;      // i18n key
  icon: string;          // Lucide icon name
  section: 'project' | 'integrations' | 'tools';
  when?: {
    projectSetting?: string;  // Show when setting is truthy
    envConfig?: string;       // Show when env config is truthy
  };
}

// Example: Specs nav appears when specKitEnabled
{
  id: 'specs',
  labelKey: 'specKit:navigation.specs',
  icon: 'FileBox',
  section: 'project',
  when: { projectSetting: 'specKitEnabled' }
}
```

#### 3. View Contribution

Integrations provide React components that are lazy-loaded:

```typescript
interface ViewContribution {
  id: string;                    // Must match navigation id
  component: string;             // Relative path to component
  keepMounted?: boolean;         // Preserve state when hidden
}

// Example: Specs view
{
  id: 'specs',
  component: './renderer/views/SpecsView.tsx'
}
```

#### 4. IPC Contribution

Integrations register namespaced IPC handlers:

```typescript
interface IpcContribution {
  namespace: string;             // Channel prefix (e.g., 'spec')
  channels: IpcChannelDef[];     // Channel definitions
  mainHandlerModule: string;     // Handler implementation
  preloadApiModule: string;      // Preload API bindings
}

// Example: Spec-Kit IPC (channels become 'spec:list', 'spec:create', etc.)
{
  namespace: 'spec',
  channels: [
    { name: 'list', type: 'invoke' },
    { name: 'create', type: 'invoke', privileged: true }
  ]
}
```

#### 5. Backend Context Contribution

Integrations inject context into the Python coder agent:

```typescript
interface BackendContextContribution {
  pythonModule: string;          // Python module path
  contextBuilderClass: string;   // Class implementing ContextProvider
  activationKey: string;         // Key in task_metadata.json
  priority?: number;             // Order in context (higher = earlier)
}

// Example: Spec-Kit injects constitution and phase context
{
  pythonModule: 'integrations.speckit',
  contextBuilderClass: 'SpecKitContextBuilder',
  activationKey: 'specKitEnabled',
  priority: 100
}
```

### Integration Manifest

Each integration declares all contributions in a single manifest:

```json
{
  "id": "speckit",
  "name": "Spec-Kit",
  "version": "1.0.0",
  "minAppVersion": "2.7.0",
  "publisher": "@auto-claude",
  "description": "8-phase spec-driven development methodology",

  "activationEvents": [
    { "type": "onProjectSetting", "key": "specKitEnabled" }
  ],

  "permissions": [
    "project:read",
    "project:write",
    "settings:read",
    "ipc:register",
    "python:context"
  ],

  "contributes": {
    "settings": { ... },
    "navigation": [ ... ],
    "views": [ ... ],
    "ipc": { ... },
    "backendContext": { ... },
    "i18n": {
      "defaultLocale": "en",
      "locales": ["en", "fr"]
    }
  }
}
```

### Directory Structure

```
apps/
├── frontend/
│   ├── src/
│   │   ├── integrations/                    # NEW
│   │   │   ├── types/                       # Core contracts
│   │   │   │   ├── manifest.ts
│   │   │   │   ├── settings.ts
│   │   │   │   ├── navigation.ts
│   │   │   │   ├── views.ts
│   │   │   │   ├── ipc.ts
│   │   │   │   └── backend.ts
│   │   │   │
│   │   │   ├── speckit/                     # Spec-Kit integration
│   │   │   │   ├── manifest.json
│   │   │   │   ├── main/
│   │   │   │   ├── renderer/
│   │   │   │   ├── python/
│   │   │   │   └── i18n/
│   │   │   │
│   │   │   ├── github/                      # Migrated GitHub integration
│   │   │   ├── gitlab/                      # Migrated GitLab integration
│   │   │   ├── linear/                      # Migrated Linear integration
│   │   │   │
│   │   │   └── registry.ts                  # Discovery and loading
│   │   │
│   │   ├── main/
│   │   │   └── extension-host/              # NEW: Main process host
│   │   │
│   │   └── renderer/
│   │       └── extension-host/              # NEW: Renderer process host
│   │
├── backend/
│   └── integrations/                        # NEW: Python integration modules
│       ├── registry.py
│       ├── speckit/
│       ├── github/
│       └── linear/
```

## Migration Path

### Phase 1: Foundation (Non-Breaking)

1. Add `/integrations/types/` with all contract interfaces
2. Add `ExtensionHost` classes (main + renderer)
3. Add `IntegrationRegistry` for discovery
4. Core changes: Make `Sidebar.tsx` and `App.tsx` consume contributions
5. Add Python `IntegrationRegistry`

**Result:** Architecture is in place, but no integrations migrated yet.

### Phase 2: Migrate Existing Integrations

1. Migrate GitHub integration to `/integrations/github/`
2. Migrate GitLab integration to `/integrations/gitlab/`
3. Migrate Linear integration to `/integrations/linear/`

Each migration is a separate PR, tested independently.

### Phase 3: Add New Integrations

1. Spec-Kit can be added as `/integrations/speckit/`
2. Future integrations follow the same pattern
3. Community can develop integrations without forking

## Security Model

### Permissions

| Permission | Allows | Risk |
|------------|--------|------|
| `project:read` | Read project files | Low |
| `project:write` | Write project files | Medium |
| `settings:read` | Read settings | Low |
| `settings:write` | Write settings | Medium |
| `network` | External network requests | Medium |
| `shell` | Execute shell commands | High |
| `python:context` | Inject Python context | High |
| `ipc:register` | Register IPC handlers | High |

### Isolation

- Each integration runs in its own namespace
- IPC channels are prefixed with integration ID
- Errors in one integration don't crash others
- High-risk permissions require user confirmation for third-party integrations

## User Experience

### For End Users

- **Discovery:** "Integrations" section in Settings shows available integrations
- **Enable/Disable:** Toggle per project or globally
- **Configuration:** Integration-specific settings appear when enabled
- **Visibility:** Sidebar items appear only when integration is enabled

### For Integration Developers

- **Scaffolding:** `auto-claude create integration my-integration`
- **Development:** Hot reload during development
- **Testing:** Test utilities for mocking Auto-Claude APIs
- **Distribution:** Publish to npm, installable via registry

## Alternatives Considered

### 1. Micro-Frontend Architecture

Each integration as a separate Vite build with Module Federation.

**Rejected:** Increased build complexity, harder to share React context, Electron's single-renderer model doesn't benefit.

### 2. Full Plugin Sandbox (iframe)

Run integration UI in sandboxed iframes like Figma.

**Rejected:** Poor integration with Zustand stores, significant performance penalty, complex IPC.

### 3. Keep Current Approach

Continue modifying core files for each integration.

**Rejected:** Unmaintainable as integrations grow, barriers to community contributions.

## Success Criteria

1. Spec-Kit integration is fully contained in `/integrations/speckit/`
2. Adding a new integration requires **zero changes to core files**
3. Existing integrations (GitHub, GitLab, Linear) successfully migrated
4. Integration bugs are contained and don't crash the core app
5. Build time increase is less than 10%
6. Developer experience for creating integrations is documented

## Open Questions

1. **Runtime vs Build-time Discovery:** Should integrations be installable at runtime (like VS Code extensions) or only at build time?

2. **Third-Party Integrations:** How do we handle security review for community integrations?

3. **Versioning:** How do we handle breaking changes in core APIs that affect integrations?

4. **State Persistence:** Should integrations have access to persistent storage beyond project settings?

## References

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)

---

## Appendix: Example Integration Manifests

### Spec-Kit Manifest

```json
{
  "id": "speckit",
  "name": "Spec-Kit",
  "version": "1.0.0",
  "minAppVersion": "2.7.0",
  "publisher": "@auto-claude",
  "description": "8-phase spec-driven development methodology with constitution support",
  "icon": "./assets/icon.svg",

  "activationEvents": [
    { "type": "onProjectSetting", "key": "specKitEnabled" }
  ],

  "permissions": [
    "project:read",
    "project:write",
    "settings:read",
    "ipc:register",
    "python:context"
  ],

  "contributes": {
    "settings": {
      "project": [
        {
          "key": "specKitEnabled",
          "type": "boolean",
          "default": false,
          "labelKey": "specKit:settings.enabled.label",
          "descriptionKey": "specKit:settings.enabled.description"
        },
        {
          "key": "specKitPhaseModels",
          "type": "object",
          "default": {},
          "labelKey": "specKit:settings.phaseModels.label",
          "when": "$.specKitEnabled === true"
        },
        {
          "key": "specKitPhaseThinking",
          "type": "object",
          "default": {},
          "labelKey": "specKit:settings.phaseThinking.label",
          "when": "$.specKitEnabled === true"
        }
      ]
    },

    "navigation": [
      {
        "id": "specs",
        "labelKey": "specKit:navigation.specs",
        "icon": "FileBox",
        "shortcut": "S",
        "order": 1,
        "section": "project",
        "when": { "projectSetting": "specKitEnabled" }
      }
    ],

    "views": [
      {
        "id": "specs",
        "component": "./renderer/views/SpecsView.tsx",
        "keepMounted": false
      }
    ],

    "ipc": {
      "namespace": "spec",
      "channels": [
        { "name": "list", "type": "invoke" },
        { "name": "get", "type": "invoke" },
        { "name": "create", "type": "invoke", "privileged": true },
        { "name": "update", "type": "invoke", "privileged": true },
        { "name": "delete", "type": "invoke", "privileged": true }
      ],
      "mainHandlerModule": "./main/handlers.ts",
      "preloadApiModule": "./preload/api.ts"
    },

    "backendContext": {
      "pythonModule": "integrations.speckit",
      "contextBuilderClass": "SpecKitContextBuilder",
      "activationKey": "specKitEnabled",
      "priority": 100
    },

    "i18n": {
      "defaultLocale": "en",
      "locales": ["en", "fr"]
    }
  }
}
```

### GitHub Manifest (Migrated)

```json
{
  "id": "github",
  "name": "GitHub",
  "version": "1.0.0",
  "minAppVersion": "2.7.0",
  "publisher": "@auto-claude",
  "description": "GitHub integration for issues, PRs, and releases",
  "icon": "./assets/github.svg",

  "activationEvents": [
    { "type": "onProjectSetting", "key": "githubEnabled" }
  ],

  "permissions": [
    "project:read",
    "settings:read",
    "network",
    "ipc:register",
    "shell"
  ],

  "contributes": {
    "settings": {
      "projectEnv": [
        {
          "key": "githubEnabled",
          "envKey": "GITHUB_ENABLED",
          "type": "boolean",
          "default": false,
          "labelKey": "github:settings.enabled.label"
        },
        {
          "key": "githubToken",
          "envKey": "GITHUB_TOKEN",
          "type": "string",
          "default": "",
          "labelKey": "github:settings.token.label",
          "sensitive": true,
          "when": "$.githubEnabled === true"
        },
        {
          "key": "githubOwner",
          "envKey": "GITHUB_OWNER",
          "type": "string",
          "labelKey": "github:settings.owner.label",
          "when": "$.githubEnabled === true"
        },
        {
          "key": "githubRepo",
          "envKey": "GITHUB_REPO",
          "type": "string",
          "labelKey": "github:settings.repo.label",
          "when": "$.githubEnabled === true"
        }
      ]
    },

    "navigation": [
      {
        "id": "github-issues",
        "labelKey": "github:navigation.issues",
        "icon": "Github",
        "shortcut": "G",
        "order": 100,
        "section": "integrations",
        "when": { "envConfig": "githubEnabled" }
      },
      {
        "id": "github-prs",
        "labelKey": "github:navigation.prs",
        "icon": "GitPullRequest",
        "shortcut": "P",
        "order": 101,
        "section": "integrations",
        "when": { "envConfig": "githubEnabled" }
      }
    ],

    "views": [
      {
        "id": "github-issues",
        "component": "./renderer/views/GitHubIssues.tsx"
      },
      {
        "id": "github-prs",
        "component": "./renderer/views/GitHubPRs.tsx",
        "keepMounted": true
      }
    ],

    "ipc": {
      "namespace": "github",
      "channels": [
        { "name": "issues:list", "type": "invoke" },
        { "name": "issues:get", "type": "invoke" },
        { "name": "issues:create", "type": "invoke", "privileged": true },
        { "name": "issues:import", "type": "invoke", "privileged": true },
        { "name": "prs:list", "type": "invoke" },
        { "name": "prs:create", "type": "invoke", "privileged": true },
        { "name": "releases:list", "type": "invoke" },
        { "name": "releases:create", "type": "invoke", "privileged": true }
      ],
      "mainHandlerModule": "./main/handlers.ts",
      "preloadApiModule": "./preload/api.ts"
    },

    "i18n": {
      "defaultLocale": "en",
      "locales": ["en", "fr"]
    }
  }
}
```
