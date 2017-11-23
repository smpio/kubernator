# Kubernator &nbsp; [![Twitter](https://img.shields.io/twitter/url/https/github.com/smpio/kubernator.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fsmpio%2Fkubernator)

[![Docker Build Status](https://img.shields.io/docker/build/smpio/kubernator.svg)](https://hub.docker.com/r/smpio/kubernator/)
[![GitHub last commit](https://img.shields.io/github/last-commit/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub commit activity the past week, 4 weeks, year](https://img.shields.io/github/commit-activity/y/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/smpio/kubernator.svg)](https://github.com/smpio/kubernator)
[![GitHub license](https://img.shields.io/github/license/smpio/kubernator.svg)](https://github.com/smpio/kubernator/blob/master/LICENSE)

`Kubernator` is an alternative [Kubernetes](https://kubernetes.io) UI. In contrast to high-level [Kubernetes Dashboard](https://github.com/kubernetes/dashboard), `Kubernator` provides low-level control and clean view on **all** objects in a cluster with the ability to create new ones, edit and resolve conflicts. As an entirely client-side app (like `kubectl`), it doesn't require any backend except Kubernetes API server itself, and also respects cluster's access control.

![Catalog: Overview](screenshots/catalog-overview.png)

## Table of Contents

- [Features](#features)
  - [Catalog](#catalog)
    - [Navigation Tree](#navigation-tree)
    - [Extensive Caching](#extensive-caching)
    - [Multiple API Versions](#multiple-api-versions)
    - [Tabs](#tabs)
    - [Copying Objects](#copying-objects)
    - [Actions Bar](#actions-bar)
    - [Keyboard Shortcuts](#keyboard-shortcuts)
    - [Diff Editor](#diff-editor)
  - [RBAC Viewer](#rbac-viewer)
    - [Controls](#controls)
    - [Graph](#graph)
  - [Notifications](#notifications)
- [Getting Started](#getting-started)
  - [Install on Cluster](#install-on-cluster-recommended)
  - [Run in Docker Locally](#run-in-docker-locally)
  - [Build and Run Locally](#build-and-run-locally)
  - [Desktop App](#desktop-app)
- [Support](#support)

## Features

### Catalog

Catalog offers an intuitive interface for managing Kubernetes objects (like `Deployment`, `Service` and everything else). Objects can be created, compared, modified and removed using a powerful diff editor.

#### Navigation Tree

Navigation tree shows objects' kinds, grouped by namespaces, and objects themselves. All API groups are fetched, which yields a list of versions and endpoints for every group. Then for all groups and versions `Kubernator` loads resources list, and then ― list of objects for every known resource. To show the tree, objects are grouped by their namespaces. Navigation has its own actions bar, which currently consists from one action ― reload namespaces.

![Catalog: Navigation Tree](screenshots/catalog-navigation-tree.gif)

#### Extensive Caching

`Kubernator` fires a lot of API calls, that's why it actively caches their responses in browser's local storage to boost loading times in subsequent uses, e.g. API groups and Swagger schemas are reloaded only when cluster is upgraded. Resources are reloaded every time the corresponding kind or namespace is being opened. And objects are reloaded again when opened in the editor.

#### Multiple API Versions

Every group fetches its resources using all API versions, not only the preferred one, and then merges given resources into one list considering versions priority. It means we can access items through different API versions. Moreover, when creating a new item, an API endpoint will be choosed automatically based on the value of `apiVersion` field in its description.

![Catalog: Multiple API Versions](screenshots/catalog-multiple-api-versions.gif)

#### Tabs

Tab names reflect current object's location in the navigation tree (resource.namespace → resource.kind → item). New items have green tab color, modified and not submitted items ― red tab color. Local modifications are saved even if the tab was closed and reopened again.

![Catalog: Tabs](screenshots/catalog-tabs.gif)

#### Copying Objects

When object is being copied, all unnecessary and read-only fields are automatically stripped as described in the corresponding Swagger scheme.

![Catalog: Copying Objects](screenshots/catalog-copying-objects.gif)

#### Actions Bar

Available actions: open a new tab copying current object; close all tabs; reload, save or delete current object; switch currently active tab to the left/right neighbour.

![Catalog: Actions Bar](screenshots/catalog-actions-bar.gif)

#### Keyboard Shortcuts

Most frequent actions have associated keyboard shortcuts.

![Catalog: Keyboard Shortcuts](screenshots/catalog-keyboard-shortcuts.gif)

#### Diff Editor

Diff editor is based on the powerful `Monaco Editor`. Cursor position, scroll position and not applied updates are saved automatically for every open tab.

![Catalog: Diff Editor](screenshots/catalog-diff-editor.gif)

### RBAC Viewer

RBAC viewer shows `Roles`, `ClusterRoles`, `RoleBindings`, `ClusterRoleBindings` and relationships between them in a visually intuitive way.

#### Controls

Simple controls pane allows to show/hide a legend, isolated nodes and extended names.

![RBAC: Overview](screenshots/rbac-overview.png)

#### Graph

Graph area (built with the awesome `d3` library) shows an interactive force graph of linked nodes. The graph can be paned, dragged and zoomed. Nodes are draggable too, and links also show some additional information when hovered.

![RBAC: Graph](screenshots/rbac-graph.gif)

### Notifications

Every error and warning shows itself in a floating message on the right top side of the window. Errors are red and don't vanish automatically as warnings do. An example of concurrent edits of the same object:

![Notifications: Overview](screenshots/notifications-overview.gif)

## Getting started

There are many ways to run `Kubernator`:

### Install on cluster (recommended)

After installation you will have access to Kubernator just by running `kubectl proxy`. You won't have to run anything else locally. To install, run the following commands:

```sh
kubectl create ns kubernator
kubectl -n kubernator run --image=smpio/kubernator --port=80 kubernator
kubectl -n kubernator expose deploy kubernator
kubectl proxy
```

Then open [service proxy URL](http://localhost:8001/api/v1/namespaces/kubernator/services/kubernator/proxy/) in your browser.

### Run in docker locally

1. Exec `docker run -d --name=kubernator -p 3000:80 smpio/kubernator`

2. Run `kubectl proxy`.

3. Open [http://localhost:3000/](http://localhost:3000/) in your browser.

### Build and run locally

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

### Desktop app

Coming soon.

## Support

Please [open an issue](https://github.com/smpio/kubernator/issues/new) for support.

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/smpio/kubernator/compare/).

MIT License
