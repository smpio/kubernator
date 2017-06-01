import { memoize } from './utils'

// TODO: doesn't take into account newResource.apiVersion
export const createResource = (newResource, kind, namespace, options) => {
  return getResourceUrl(null, kind, namespace).then(url => {
    options = {
      ...options,
      method: 'POST',
      body: newResource,
    }
    return fetchPath(url, options)
  })
}

export const updateResource = (resource, newResource, options) => {
  let url = resource.metadata.selfLink
  options = {
    ...options,
    method: 'PUT',
    body: newResource,
  }
  return fetchPath(url, options)
}

export const fetchResource = (name, kind, namespace, options) => {
  return getResourceUrl(name, kind, namespace).then(url => (
    fetchPath(url, options).then(data => {
      if (!name) {
        return getResourceKinds().then(resources => {
          let resource = resources[kind]
          data.items = data.items.map(item => ({
            ...item,
            apiVersion: resource.apiVersion,
            kind: resource.kind,
          }))
          return data
        })
      }
      return data
    })
  ))
}

export const getResourceUrl = (name, kind, namespace) => {
  return getResourceKind(kind).then(resource => {
    let url = getUrlByVersion(resource.apiVersion)

    if (namespace && resource.namespaced) {
      url += 'namespaces/' + namespace + '/'
    }

    url += resource.name

    if (name) {
      url += '/' + name
    }

    return url
  })
}

export const getResourceKind = (kind) => {
  return getResourceKinds().then(resources => {
    let resource = resources[kind]
    if (!resource) throw ('Unknown resource kind ' + kind)
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

export const getResourceKindsPrioritized = memoize(() => {
  return getResourceKinds().then(resources => {
    resources = {...resources}
    let ordered = kindsByPriority.reduce((ordered, kind) => {
      let resource = resources[kind]
      if (resource) {
        delete resources[kind]
        ordered.push(resource)
      }
      return ordered
    }, [])
    return [
      ...ordered,
      ...Object.values(resources),
    ]
  })
})

export const getResourceKinds = memoize(() => {
  return getListableResourceApis().then(resourceApis => (
    resourceApis.reduce((kinds, resourceApi) => {
      let existingResourceApi = kinds[resourceApi.kind]
      if (!existingResourceApi || existingResourceApi.apiVersion == 'extensions/v1beta1') {
        kinds[resourceApi.kind] = resourceApi
      } else {
        console.error('Multiple API resources for same kind:',
          existingResourceApi.apiVersion, resourceApi.apiVersion,
          'ignoring the latter')
      }
      return kinds
    }, {})
  ))
})

export const getListableResourceApis = memoize(() => {
  return getResourceApis()
    .then(resourceApis => resourceApis.filter(resourceApi => (
      resourceApi.verbs.indexOf('list') != -1
    )))
})

export const getResourceApis = memoize(() => {
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

    if (options.type == 'json') {
      data = response.json()
    } else {
      data = response.text()
    }

    if (response.status != 200) {
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
