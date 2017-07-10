import { createSelector } from 'reselect';

import {
  RESOURCE_ID,
  NO_NAMESPACE,
} from '../../../modules/k8s';


const RESOURCE_ROLE = 'roles';
const RESOURCE_CLUSTER_ROLE = 'clusterroles';
const RESOURCE_ROLE_BINDING = 'rolebindings';
const RESOURCE_CLUSTER_ROLE_BINDING = 'clusterrolebindings';

class GraphData {

  constructor(flags) {
    this.nId = 0;
    this.oKinds = {
      [RESOURCE_ROLE]: 'Role',
      [RESOURCE_CLUSTER_ROLE]: 'ClusterRole',
      [RESOURCE_ROLE_BINDING]: 'RoleBinding',
      [RESOURCE_CLUSTER_ROLE_BINDING]: 'ClusterRoleBinding',
    };

    this.oNodes = {};
    this.aLinks = [];

    this.flags = flags;

    this.getId = this.getId.bind(this);
    this.getKind = this.getKind.bind(this);
    this.getKey = this.getKey.bind(this);
  }

  getId() {
    return ++this.nId;
  }

  getKind(resource) {
    return this.oKinds[resource];
  }

  getKey(node) {
    const { kind, name } = node;
    return `${kind}:${name}`;
  }

  createNode(node) {
    const { oNodes, getId, getKey } = this;
    const key = getKey(node);
    if (!oNodes[key]) oNodes[key] = { ...node, id: getId() };
    return key;
  }

  createLink(link) {
    const {
      oNodes,
      aLinks,
      getId,
      flags: {
        showIsolated,
      },
    } = this;

    // create link
    aLinks.push({ ...link, id: getId() });

    // mark nodes as linked
    if (!showIsolated) {
      const { source, target } = link;
      oNodes[source].$linked = true;
      oNodes[target].$linked = true;
    }
  }

  findNode(node) {
    const { oNodes, getKey } = this;
    const key = getKey(node);
    return oNodes[key] && key;
  }

  getData() {
    const {
      oNodes,
      aLinks,
      flags: {
        showIsolated,
      },
    } = this;

    // nodes
    const oKeyToIndex = {};
    let nodes = Object.keys(oNodes);
    if (!showIsolated) nodes = nodes.filter(key => oNodes[key].$linked);
    nodes = nodes.map((key, index) => {
      oKeyToIndex[key] = index;
      return oNodes[key];
    });

    // links
    const links = aLinks.map(link => ({
      ...link,
      source: oKeyToIndex[link.source],
      target: oKeyToIndex[link.target],
    }));

    //
    return { nodes, links };
  }
}

const selectItems = state => state.items;

const selectFlags = (state, props) => ({
  showIsolated: props.showIsolated,
  showNamespaces: props.showNamespaces,
});

export const selectGraphData = createSelector(
  [selectItems, selectFlags],
  (items, flags) => {
    const namespaceName = NO_NAMESPACE;
    const gd = new GraphData(flags);

    // filter namespace
    const itemsNamespace = Object.keys(items)
      .filter(id => {
        const { namespace = NO_NAMESPACE } = items[id].metadata;
        return namespace === namespaceName;
      })
      .map(id => items[id]);

    // add roles
    itemsNamespace
      .filter(item => {
        const { [RESOURCE_ID]: resource } = item;
        return (
          resource === RESOURCE_ROLE ||
          resource === RESOURCE_CLUSTER_ROLE
        );
      })
      .forEach(item => {
        const { metadata: { uid, name }, [RESOURCE_ID]: resource } = item;
        gd.createNode({ kind: gd.getKind(resource), name, uid });
      });

    // add subjects
    // User, Group, ServiceAccount
    itemsNamespace
      .filter(item => {
        const { [RESOURCE_ID]: resource } = item;
        return (
          resource === RESOURCE_ROLE_BINDING ||
          resource === RESOURCE_CLUSTER_ROLE_BINDING
        );
      })
      .forEach(item => {
        const {
          metadata: {
            uid: itemUid,
            name: itemName,
          },
          subjects,
          roleRef: {
            kind: roleKind,
            name: roleName,
          },
          [RESOURCE_ID]: resource,
        } = item;

        // role
        const roleId = gd.findNode({
          kind: roleKind,
          name: roleName,
        });

        //
        roleId && subjects.forEach(subject => {
          const { kind, name } = subject;

          // subject
          const subjectId = gd.createNode({
            kind,
            name,
            uid: null,
          });

          // link
          gd.createLink({
            source: subjectId,
            target: roleId,
            kind: gd.getKind(resource),
            name: itemName,
            uid: itemUid,
          });
        });
      });

    //
    return gd.getData();
  },
);
