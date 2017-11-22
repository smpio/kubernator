import { createSelector } from 'reselect';

import {
  RESOURCE_ID,
} from '../../../modules/k8s';


const RESOURCE_ROLE = 'roles';
const RESOURCE_CLUSTER_ROLE = 'clusterroles';
const RESOURCE_ROLE_BINDING = 'rolebindings';
const RESOURCE_CLUSTER_ROLE_BINDING = 'clusterrolebindings';

const KIND_ROLE = 'Role';
const KIND_CLUSTER_ROLE = 'ClusterRole';
const KIND_ROLE_BINDING = 'RoleBinding';
const KIND_CLUSTER_ROLE_BINDING = 'ClusterRoleBinding';

class GraphData {

  constructor(flags) {
    this.nId = 0;
    this.oKinds = {
      [RESOURCE_ROLE]: KIND_ROLE,
      [RESOURCE_CLUSTER_ROLE]: KIND_CLUSTER_ROLE,
      [RESOURCE_ROLE_BINDING]: KIND_ROLE_BINDING,
      [RESOURCE_CLUSTER_ROLE_BINDING]: KIND_CLUSTER_ROLE_BINDING,
    };
    this.oNodes = {};
    this.aLinks = [];
    this.flags = flags;
  }

  getId = () => {

    return ++this.nId;
  };

  getKind = resource => {

    return this.oKinds[resource];
  };

  getKey = node => {
    const { kind, name } = node;
    return `${kind}:${name}`;
  };

  createNode = node => {
    const { oNodes, getId, getKey } = this;
    const key = getKey(node);
    if (!oNodes[key]) oNodes[key] = { ...node, id: getId() };
    return key;
  };

  createLink = link => {
    const {
      oNodes,
      aLinks,
      getId,
      flags: {
        showIsolated,
        showNames,
      },
    } = this;

    // create names
    const { kind, namespace, name } = link;
    const fullname = namespace ? `${namespace} / ${name}` : name;
    const shortname = kind === KIND_ROLE_BINDING ? namespace : '';

    // create link
    aLinks.push({
      ...link,
      id: getId(),
      fullname,
      shortname: showNames ? fullname : shortname,
    });

    // mark nodes as linked
    if (!showIsolated) {
      const { source, target } = link;
      oNodes[source].$linked = true;
      oNodes[target].$linked = true;
    }
  };

  findNode = node => {
    const { oNodes, getKey } = this;
    const key = getKey(node);
    return oNodes[key] && key;
  };

  getData = () => {
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
  };
}

const selectItems = state => state.items;

const selectFlags = (state, props) => ({
  showIsolated: props.showIsolated,
  showNames: props.showNames,
});

export const selectGraphData = createSelector(
  [selectItems, selectFlags],
  (items, flags) => {
    const gd = new GraphData(flags);
    const itemsArr = Object.keys(items).map(id => items[id]);

    // add roles
    itemsArr
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
    itemsArr
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
            namespace: itemNamespace,
            name: itemName,
            uid: itemUid,
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
            namespace: itemNamespace,
            name: itemName,
            uid: itemUid,
          });
        });
      });

    //
    return gd.getData();
  },
);
