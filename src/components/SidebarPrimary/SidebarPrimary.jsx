'use client';

import { List, ListItemButton, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useSpecState } from '@/hooks/useSpecState';
import { getPaths, getSchemas, getWebhooks, getDomainModels } from '@/utils/specUtils';
import { groupByTags } from '@/components/EndpointsList/helpers/groupByTags';
import './SidebarPrimary.scss';

const menuItems = [
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'objects', label: 'Objects' },
  { id: 'webhooks', label: 'WebHooks' },
  { id: 'entities', label: 'Entities' },
];

export default function SidebarPrimary() {
  const {
    spec,
    isSwagger,
    selectedSection,
    selectedTag,
    openSections,
    setSelectedSection,
    setSelectedTag,
    toggleSection,
  } = useSpecState();

  if (!spec) return null;

  const handleSectionClick = (sectionId) => {
    toggleSection(sectionId);
    setSelectedSection(sectionId);
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
  };

  // Get tags for endpoints
  const getEndpointTags = () => {
    const paths = getPaths(spec);
    const grouped = groupByTags(paths);
    return Object.keys(grouped).sort();
  };

  // Get objects
  const getObjectsList = () => {
    const allSchemas = getSchemas(spec, isSwagger);
    const domainModels = getDomainModels(allSchemas);
    return Object.keys(domainModels).sort();
  };

  // Get webhooks
  const getWebhooksList = () => {
    const webhooks = getWebhooks(spec, isSwagger);
    return Object.keys(webhooks).sort();
  };

  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case 'endpoints': {
        const tags = getEndpointTags();
        return (
          <List component="div" disablePadding className="sidebar-primary__submenu">
            {tags.length === 0 && (
              <div className="sidebar-primary__empty">No tags found</div>
            )}
            {tags.map((tag) => (
              <ListItemButton
                key={tag}
                className={`sidebar-primary__subitem ${selectedTag === tag ? 'sidebar-primary__subitem--selected' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                <ListItemText
                  primary={tag}
                  primaryTypographyProps={{ className: 'sidebar-primary__subitem-label' }}
                />
              </ListItemButton>
            ))}
          </List>
        );
      }

      case 'objects': {
        const objects = getObjectsList();
        return (
          <List component="div" disablePadding className="sidebar-primary__submenu">
            {objects.length === 0 && (
              <div className="sidebar-primary__empty">No objects found</div>
            )}
            {objects.map((name) => (
              <ListItemButton
                key={name}
                className={`sidebar-primary__subitem ${selectedTag === name ? 'sidebar-primary__subitem--selected' : ''}`}
                onClick={() => handleTagClick(name)}
              >
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ className: 'sidebar-primary__subitem-label' }}
                />
              </ListItemButton>
            ))}
          </List>
        );
      }

      case 'webhooks': {
        const webhooks = getWebhooksList();
        return (
          <List component="div" disablePadding className="sidebar-primary__submenu">
            {webhooks.length === 0 && (
              <div className="sidebar-primary__empty">No webhooks found</div>
            )}
            {webhooks.map((name) => (
              <ListItemButton
                key={name}
                className={`sidebar-primary__subitem ${selectedTag === name ? 'sidebar-primary__subitem--selected' : ''}`}
                onClick={() => handleTagClick(name)}
              >
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ className: 'sidebar-primary__subitem-label' }}
                />
              </ListItemButton>
            ))}
          </List>
        );
      }

      case 'entities':
        return (
          <div className="sidebar-primary__empty">No entities defined</div>
        );

      default:
        return null;
    }
  };

  return (
    <nav className="sidebar-primary">
      <div className="sidebar-primary__header">
        <h3>OpenAPI Viewer</h3>
      </div>
      <List className="sidebar-primary__list">
        {menuItems.map((menuItem) => (
          <div key={menuItem.id}>
            <ListItemButton
              onClick={() => handleSectionClick(menuItem.id)}
              className={`sidebar-primary__item ${openSections[menuItem.id] ? 'sidebar-primary__item--active' : ''}`}
            >
              <ListItemText primary={menuItem.label} />
              {openSections[menuItem.id] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openSections[menuItem.id]} timeout="auto" unmountOnExit>
              {renderSectionContent(menuItem.id)}
            </Collapse>
          </div>
        ))}
      </List>
    </nav>
  );
}
