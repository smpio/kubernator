import { memoize } from './utils'

// TODO: doesn't take into account newResource.apiVersion
export const createObject = (newObj, kind, namespace, options) => {
  return getUrlByKind(kind, namespace).then(url => {
    options = {
      ...options,
      method: 'POST',
      body: newObj,
    }
    return fetchPath(url, options)
  })
}

export const updateObject = (obj, newObj, options) => {
  let url = obj.metadata.selfLink
  options = {
    ...options,
    method: 'PUT',
    body: newObj,
  }
  return fetchPath(url, options)
}

export const deleteObject = (obj) => {
  return fetchPath(obj.metadata.selfLink, {
    method: 'DELETE',
  })
}

export const fetchObject = (name, kind, namespace, options) => {
  return getObjectUrl(name, kind, namespace).then(url => fetchPath(url, options))
}

export const getObjectUrl = (name, kind, namespace) => {
  return getUrlByKind(kind, namespace).then(url => url + '/' + name)
}

export const fetchObjectsByKind = (kind, namespace, options) => {
  return getUrlByKind(kind, namespace).then(url => (
    fetchPath(url, options).then(data => {
      return getResourceByKind(kind).then(resource => {
        data.items = data.items.map(item => ({
          ...item,
          apiVersion: resource.apiVersion,
          kind: resource.kind,
        }))
        return data
      })
    })
  ))
}

export const getUrlByKind = (kind, namespace) => {
  return getResourceByKind(kind).then(resource => {
    let url = getUrlByVersion(resource.apiVersion)

    if (namespace && resource.namespaced) {
      url += 'namespaces/' + namespace + '/'
    }

    return url + resource.name
  })
}

export const getResourceByKind = (kind) => {
  return getMapKindResource().then(map => {
    let resource = map[kind]
    if (!resource) throw ('No resource for kind ' + kind)
    return resource
  })
}

export const getUrlByVersion = (apiVersion) => {
    if (apiVersion == 'v1') {
      return 'api/v1/'
    } else {
      return 'apis/' + apiVersion + '/'
    }
}

export const getResourcesPrioritized = memoize(() => {
  return getMapKindResource().then(map => {
    map = {...map}
    let ordered = kindsByPriority.reduce((ordered, kind) => {
      let resource = map[kind]
      if (resource) {
        delete map[kind]
        ordered.push(resource)
      }
      return ordered
    }, [])
    return [
      ...ordered,
      ...Object.values(map),
    ]
  })
})

export const getMapKindResource = memoize(() => {
  return getListableResources().then(resources => (
    resources.reduce((kinds, resource) => {
      let existingResource = kinds[resource.kind]
      if (!existingResource || existingResource.apiVersion == 'extensions/v1beta1') {
        kinds[resource.kind] = resource
      } else {
        console.error('Multiple resources for same kind:',
          existingResource.apiVersion, resource.apiVersion,
          'ignoring the latter')
      }
      return kinds
    }, {})
  ))
})

export const getListableResources = memoize(() => {
  return getResources()
    .then(resources => resources.filter(resource => (
      resource.verbs.indexOf('list') != -1
    )))
})

export const getResources = memoize(() => {
  return getApiGroups()
    .then(apiGroups => Promise.all(apiGroups.map(apiGroup => fetchPath(apiGroup.url))))
    .then(apiGroupInfos => (
      apiGroupInfos.map(apiGroupInfo => (
        apiGroupInfo.resources.map(resource => ({
          ...resource,
          apiVersion: apiGroupInfo.groupVersion
        }))
      ))
    ))
    .then(listOfResourceLists => listOfResourceLists.reduce((flatList, nextResourceList) => [
      ...flatList,
      ...nextResourceList,
    ], []))
})

export const getApiGroups = memoize(() => {
  return fetchPath('apis')
    .then(data => data.groups.map(apiGroup => ({
      version: apiGroup.preferredVersion.groupVersion,
      url: 'apis/' + apiGroup.preferredVersion.groupVersion,
    })))
    .then(apiGroups => [
      ...apiGroups,
      {
        version: 'v1',
        url: 'api/v1',
      },
    ])
})

export function fetchPath (path, options) {
  options = {
    method: 'GET',
    type: 'json',
    ...options,
  }

  let init = {
    method: options.method,
    body: options.body,
    headers: {
      Accept: 'application/' + options.type,
      'Content-Type': 'application/' + options.type,
    },
  }

  return fetch(getUrl(path), init).then(response => {
    let data;

    if (response.headers.get('Content-Type') == 'application/json') {
      data = response.json()
    } else {
      data = response.text()
    }

    if (response.status.toString()[0] != '2') {
      return data.then(data => {
        response.data = data
        return Promise.reject(response)
      })
    }

    return data
  })
}

export function getUrl (path) {
  if (path[0] == '/') {
    path = path.slice(1)
  }

  if (__DEV__) {
    return '/k8s/' + path
  } else {
    return '/' + path
  }
}

const kindsByPriority = [
  'Ingress',
  'Service',
  'Deployment',
  'ReplicaSet',
  'DaemonSet',
  'StatefulSet',
  'ReplicationController',
  'Pod',
  'Job',
  'PersistentVolumeClaim',
  'ConfigMap',
  'Secret',
  'ServiceAccount',
  'Role',
  'RoleBinding',
]
