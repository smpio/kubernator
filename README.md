# Kubernator

[![GitHub closed issues](https://img.shields.io/github/issues-closed/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub last commit](https://img.shields.io/github/last-commit/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub commit activity the past week, 4 weeks, year](https://img.shields.io/github/commit-activity/y/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub license](https://img.shields.io/github/license/smpio/kubernator.svg)](https://github.com/smpio/kubernator/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/smpio/kubernator.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fsmpio%2Fkubernator)

## Table of Contents

- [Purpose](#purpose)
- [Features](#features)
  - [Catalog](#catalog)
    - [Navigation](#navigation)
      - [Cache](#cache)
      - [Multiple API versions](#multiple-api-versions)
    - [Content](#content)
      - [Tabs](#tabs)
      - [Actions bar](#actions-bar)
      - [Editor](#editor)
  - [Rbac](#rbac)
    - [Controls](#controls)
    - [Graph](#graph)
  - [Notifications](#notifications)
- [Installation](#installation)
- [Support](#support)

## Purpose

`Kubernator` is an alternative [Kubernetes](https://kubernetes.io/) UI. Although `kubectl` is a recommended way for running commands against Kubernetes clusters, it's just a command line tool, which lacks visual control and general convenience when working with YAML configs. `Kubernator` is built on top of `kubectl`'s API and offers simple yet powerful graphical interface.

![Catalog Overview](screenshots/catalog-overview.png)

## Features

### Catalog

Catalog offers an intuitive interface for managing `Groups`, `Resources` and `Items` through the `kubectl` API instead of using console commands. Resource items can be created, compared, modified and removed using a powerful diff editor.

#### Navigation

Navigation tree shows resources, grouped by namespaces, and resource items inside. All API groups are fetched, which yields a list of versions and endpoints for every group. Then for all groups and versions `Kubernator` loads resources list, and then ― list of items for every known resource. To show the tree, resources are grouped by their namespaces. Navigation has its own actions bar, which currently consists from one action ― reload namespaces.

![Catalog Navigation](screenshots/catalog-navigation.gif)

##### Cache

`Kubernator` fires a lot of API calls, that's why it actively caches their responses in browser's local storage to boost loading times in subsequent uses, e.g. API groups and Swagger schemas are reloaded only when `kubectl` updates. Resources reload every time the corresponding tree node is being opened. And items are reloaded again when opened in editor.

##### Multiple API versions

Every group fetches its resources using all API versions, not only the preferred one, and then merges given resources into one list considering versions priority. It means we can access items through different API versions. Moreover, for a new item, an API endpoint will be choosed automatically based on the value of `apiVersion` field in its description.

![Catalog Editor API Versions](screenshots/catalog-editor-api-versions.gif)

#### Content

Content pane shows open items grouped in tabs, actions bar and diff editor, which does also provide handy key bindings for the most recent actions.

##### Tabs

Tab names reflect current item's position in the navigation tree (resource namespace → resource kind → item). New items have green tab color, modified and not submitted items ― red tab color. Local modifications are saved even if the tab was closed and reopened again.

![Catalog Tab Colors](screenshots/catalog-tab-colors.gif)

When a new item is being created based on the currently opened one, all unnecessary and read-only fields are automatically stripped as described in the corresponding Swagger scheme.

![Catalog Tab New](screenshots/catalog-tab-new.gif)

##### Actions bar

Available actions: open a new tab based on currently active one; close all tabs; reload, save or delete current item; switch currently active tab to the left/right neighbour.

![Catalog Tab Manipulations](screenshots/catalog-tab-manipulations.gif)

Most frequent actions have associated keyboard shortcuts.

![Catalog Editor Key Bindings](screenshots/catalog-editor-key-bindings.gif)

##### Editor

Diff editor is based on the powerful [Monaco Editor](https://microsoft.github.io/monaco-editor/). Cursor position, scroll position and not applied updates are saved automatically for every open tab.

![Catalog Editor Diffs](screenshots/catalog-editor-diffs.gif)

### Rbac

Rbac shows `Roles`, `ClusterRoles`, `RoleBindings`, `ClusterRoleBindings` and relationships between them in a visually intuitive way.

#### Controls

Simple controls pane allows to show/hide a legend, isolated nodes and extended names.

![Rbac Overview](screenshots/rbac-overview.png)

#### Graph

Graph area (built with the awesome `d3` library) shows an interactive force graph of linked nodes. The graph can be paned, dragged and zoomed. Nodes are draggable too, and links also show some additional information when hovered.

![Rbac Graph](screenshots/rbac-graph.gif)

### Notifications

Every error and warning shows itself in a floating message on the right top side of the window. Errors are red and don't vanish automatically as warnings do. An example of concurrent edits of the same item:

![Catalog Notifications](screenshots/catalog-notifications.gif)

## Installation

1. Install and [set up](https://kubernetes.io/docs/tasks/tools/install-kubectl/) `kubectl`
  
2. Clone and build `Kubernator`:

    ```sh
    yarn install && yarn build
    ```

3. Run Kubernetes API server:

    ```sh
    kubectl proxy
    ```

4. Update `proxy` value in `package.json` according to the previous command's output.

5. Run `Kubernator`:

    ```sh
    yarn start
    ```

## Support

Please [open an issue](https://github.com/smpio/kubernator/issues/new) for support.

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/smpio/kubernator/compare/).

MIT License
