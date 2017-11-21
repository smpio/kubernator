# Kubernator

Alternative [Kubernetes](https://kubernetes.io/) UI

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Support](#support)
- [Contributing](#contributing)
- [License](#license)

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

## Features

### Catalog

#### Navigation

##### Cache

##### Tree view

##### Lazy loading

##### Group by namespace

##### Same group, different API versions

##### Reload namespaces

#### Content

##### Tabs

Naming (namespace -> resource -> item)
Colors (created | modified | original)

##### Diff editor

Saved in state:
+ Scroll position
+ Cursor position
+ Not applied updates

##### Create tab

+ Based on the currently open tab. Swagger schemas.
+ Allow custom API version.

##### Close tabs

##### Key bindings

+ Reload item
+ Save item
+ Delete item
+ Switch tab (left/right)

##### Notifications

### Rbac

#### Legend

#### Graph

## Support

Please [open an issue](https://github.com/smpio/kubernator/issues/new) for support.

## Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/fraction/readme-boilerplate/compare/).

## License

MIT
