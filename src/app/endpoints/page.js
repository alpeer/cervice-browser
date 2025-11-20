'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSpecState } from '@/hooks/useSpecState'
import { getPaths } from '@/utils/specUtils'
import { groupByTags } from '@/components/EndpointsList/helpers/groupByTags'
import AppLayout from '@/components/AppLayout/AppLayout'
import Button from '@/ui/Button/Button'
import SpecUploader from '@/components/SpecUploader/SpecUploader'
import styles from "../page.module.scss"
export default function EndpointsPage() {
  const router = useRouter()
  const {
    spec,
    isValid,
    errors,
    version,
    schemaVersion,
    isSwagger,
    selectedSection,
    openSections,
    setSelectedSection,
    setSidebarPrimary,
    clearSidebarSecondary,
    toggleSection,
    clearSpec,
  } = useSpecState()

  // Set section to endpoints and configure sidebars
  useEffect(() => {
    if (selectedSection !== 'endpoints') {
      setSelectedSection('endpoints')
    }

    if (!spec) return

    // Get tags from spec
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
        children: tags.map(tag => ({
          id: tag,
          label: tag,
          onClick: () => router.push(`/endpoints/${encodeURIComponent(tag)}`),
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
    clearSidebarSecondary()

    // Auto-expand endpoints section
    if (!openSections.endpoints) {
      toggleSection('endpoints')
    }
  }, [spec, selectedSection, setSelectedSection, setSidebarPrimary, clearSidebarSecondary, router])

  if (!spec) {
    return (
      <AppLayout>
        <div className={styles.specUploaderContainer}>
          <SpecUploader />
          <div className={styles.orDivider}>
            <span>OR</span>
          </div>
          <Button
            onClick={() => router.push('/entities')}
            variant="outlined"
            size="large"
          >
            Go to Entity Diagram
          </Button>
        </div>
      </AppLayout>
    )
  }

  if (!isValid) {
    return (
      <AppLayout>
        <div className={styles.validationErrors}>
          <h2>Validation Errors</h2>
          <p>Your spec has validation errors:</p>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>
                <strong>{error.path || 'root'}:</strong> {error.message}
              </li>
            ))}
          </ul>
          <Button onClick={clearSpec} variant="outlined">
            Upload Different Spec
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showSidebars>
      <div className={styles.header}>
        <div className={styles.specInfo}>
          <h1>{spec.info?.title || 'OpenAPI Specification'}</h1>
          <p className={styles.version}>
            {isSwagger ? 'Swagger' : 'OpenAPI'} {version}
            {schemaVersion && version !== schemaVersion && ` (validated against ${schemaVersion})`}
          </p>
          {spec.info?.description && (
            <p className={styles.description}>{spec.info.description}</p>
          )}
        </div>
        <Button onClick={clearSpec} variant="outlined" size="small">
          Change Spec
        </Button>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.content}>
          <h2>Select a tag from the sidebar</h2>
          <p>Choose a tag to view its endpoints</p>
        </div>
      </div>
    </AppLayout>
  )
}
