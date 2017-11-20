# kube-browser

Alternative [Kubernetes](https://kubernetes.io/) UI

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Support](#support)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Install and [set up](https://kubernetes.io/docs/tasks/tools/install-kubectl/) `kubectl`
  
2. Clone and build `kube-browser`:

    ```sh
    yarn install && yarn build
    ```

3. Run Kubernetes API server:

    ```sh
    kubectl proxy
    ```

4. Update `proxy` value in `package.json` according to the previous command's output.

5. Run `kube-browser`:

    ```sh
    yarn start
    ```

## Usage

## Support

Please [open an issue](https://github.com/smpio/kube-browser/issues/new) for support.

## Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/fraction/readme-boilerplate/compare/).

## License

MIT
