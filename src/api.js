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
  return getResourceKinds().then(resources => {
    let resource = resources[kind]
    if (!resource) throw ('Unknown resource kind ' + kind)

    let url = 'apis/' + resource.apiVersion + '/'
    if (resource.apiVersion == 'v1') {
      url = 'api/v1/'
    }

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

export const getResourceKindsPrioritized = cacheResult(() => {
  return getResourceKinds().then(resources => {
    resources = {...resources}
    let list = kindsByPriority.reduce((list, kind) => {
      let resource = resources[kind]
      if (resource) {
        delete resources[kind]
        list.push(resource)
      }
      return list
    }, [])
    return [
      ...list,
      ...Object.values(resources),
    ]
  })
})

export const getResourceKinds = cacheResult(() => {
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

export const getListableResourceApis = cacheResult(() => {
  return getResourceApis()
    .then(resourceApis => resourceApis.filter(resourceApi => (
      resourceApi.verbs.indexOf('list') != -1
    )))
})

export const getResourceApis = cacheResult(() => {
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

export const getApiGroups = cacheResult(() => {
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

function cacheResult (func) {
  let value = undefined;

  return function () {
    if (value === undefined) {
      value = func.apply(this, arguments)
    }
    return value
  }
}

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
    if (response.status != 200) {
      return Promise.reject(response)
    }

    if (options.type == 'json') {
      return response.json()
    } else {
      return response.text()
    }
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
