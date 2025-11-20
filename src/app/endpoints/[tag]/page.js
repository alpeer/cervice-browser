'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useSpecState } from '@/hooks/useSpecState'
import { getPaths } from '@/utils/specUtils'
import { groupByTags, getMethodColor } from '@/components/EndpointsList/helpers/groupByTags'
import AppLayout from '@/components/AppLayout/AppLayout'
import EndpointDetail from '@/components/EndpointDetail/EndpointDetail'
import Button from '@/ui/Button/Button'

export default function EndpointsTagPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const tag = decodeURIComponent(params.tag)
  const route = searchParams.get('route')
  const method = searchParams.get('method')

  const {
    spec,
    isValid,
    version,
    schemaVersion,
    isSwagger,
    selectedSection,
    selectedItem,
    setSelectedSection,
    setSelectedItem,
    setSidebarPrimary,
    setSidebarSecondary,
    clearSpec,
  } = useSpecState()

  // Get endpoints for this tag
  const endpoints = useMemo(() => {
    if (!spec) return []
    const paths = getPaths(spec)
    const grouped = groupByTags(paths)
    return grouped[tag] || []
  }, [spec, tag])

  // Find selected endpoint if route param is provided
  const selectedEndpoint = useMemo(() => {

    if (!route || endpoints.length === 0) return null
    const decodedRoute = decodeURIComponent(route)
    const decodedMethod = decodeURIComponent(method)
    return endpoints.find(ep => (ep.path === decodedRoute && ep.method === decodedMethod) || `${ep.method}_${ep.path}` === decodedRoute)
  }, [route, method, JSON.stringify(endpoints)])
  // Configure sidebars
  useEffect(() => {
    if (selectedSection !== 'endpoints') {
      setSelectedSection('endpoints')
    }

    if (!spec) return

    // Get all tags for primary sidebar
    const paths = getPaths(spec)
    const grouped = groupByTags(paths)
    const tags = Object.keys(grouped).sort()

    // Configure primary sidebar
    const primaryItems = [
      {
        id: 'endpoints',
        label: 'Endpoints',
        collapsible: true,
        active: true,
        children: tags.map(t => ({
          id: t,
          label: t,
          selected: t === tag,
          onClick: () => router.push(`/endpoints/${encodeURIComponent(t)}`),
        })),
      },
      {
        id: 'objects',
        label: 'Objects',
        collapsible: false,
        onClick: () => router.push('/objects'),
      },
      {
        id: 'webhooks',
        label: 'WebHooks',
        collapsible: false,
        onClick: () => router.push('/webhooks'),
      },
      {
        id: 'entities',
        label: 'Entities',
        collapsible: false,
        onClick: () => router.push('/entities'),
      },
    ]

    setSidebarPrimary(primaryItems)

    // Configure secondary sidebar with endpoints
    const secondaryItems = endpoints.map(endpoint => ({
      id: endpoint.operationId || `${endpoint.method}_${endpoint.path}`,
      label: endpoint.path,
      subtitle: endpoint.summary,
      method: endpoint.method,
      selected: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method,
      onClick: () => {
        setSelectedItem(endpoint)
        router.push(`/endpoints/${encodeURIComponent(tag)}?route=${encodeURIComponent(endpoint.path)}&method=${endpoint.method}`)
      },
    }))

    setSidebarSecondary(tag, `${endpoints.length} endpoints`, secondaryItems)

    // Set selected item if route param matches
    if (selectedEndpoint && (!selectedItem || selectedItem.path !== selectedEndpoint.path)) {
      setSelectedItem(selectedEndpoint)
    }
  }, [spec, tag, endpoints, selectedEndpoint, selectedSection, selectedItem, setSelectedSection, setSelectedItem, setSidebarPrimary, setSidebarSecondary, router])

  if (!spec || !isValid) {
    router.push('/endpoints')
    return null
  }

  if (endpoints.length === 0) {
    return (
      <AppLayout showSidebars>
        <div className="content__header">
          <div className="spec-info">
            <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
            <p className="spec-info__version">
              {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
              {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
            </p>
          </div>
          <Button onClick={clearSpec} variant="outlined" size="small">
            Change Spec
          </Button>
        </div>
        <div className="empty-state">
          <div className="empty-state__content">
            <h2>No endpoints found for tag: {tag}</h2>
            <p>This tag doesn't contain any endpoints</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showSidebars>
      <div className="content__header">
        <div className="spec-info">
          <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
          <p className="spec-info__version">
            {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
            {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
          </p>
          {spec.info?.description && (
            <p className="spec-info__description">{spec.info.description}</p>
          )}
        </div>
        <Button onClick={clearSpec} variant="outlined" size="small">
          Change Spec
        </Button>
      </div>

      {selectedEndpoint ? (
        <EndpointDetail endpoint={selectedEndpoint} spec={spec} isSwagger={isSwagger} />
      ) : (
        <div className="empty-state">
          <div className="empty-state__content">
            <h2>Select an endpoint from the sidebar</h2>
            <p>Choose an endpoint to view its details</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
