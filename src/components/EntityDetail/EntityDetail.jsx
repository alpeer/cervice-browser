'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@mui/material';
import { Upload, Delete } from '@mui/icons-material';
import { useSpecState } from '@/hooks/useSpecState';
import { parseEntities, entitiesToNodes, relationsToEdges } from '@/utils/entityParser';
import EntityNode from '@/components/EntityNode/EntityNode';
import './EntityDetail.scss';

const nodeTypes = {
  entityNode: EntityNode,
};

export default function EntityDetail() {
  const {
    entities,
    relations,
    focusedEntity,
    setEntities,
    clearEntities,
    addToast,
  } = useSpecState();

  const reactFlowInstance = useRef(null);
  const fileInputRef = useRef(null);

  // Convert entities to nodes and edges
  const initialNodes = useMemo(() => {
    return entitiesToNodes(entities, relations);
  }, [entities, relations]);

  const initialEdges = useMemo(() => {
    return relationsToEdges(relations);
  }, [relations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when entities or relations change
  useEffect(() => {
    setNodes(entitiesToNodes(entities, relations));
  }, [entities, relations, setNodes]);

  // Update edges when relations change
  useEffect(() => {
    setEdges(relationsToEdges(relations));
  }, [relations, setEdges]);

  // Apply focused class to entity node when hovering in sidebar
  useEffect(() => {
    if (focusedEntity) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          className: node.id === focusedEntity ? 'focused' : '',
        }))
      );
    } else {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          className: '',
        }))
      );
    }
  }, [focusedEntity, setNodes]);

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const parsedFiles = [];

    for (const file of files) {
      const content = await file.text();
      parsedFiles.push({
        name: file.name,
        content,
      });
    }

    // Parse all entities with validation
    const { entities: newEntities, relations: newRelations, validationErrors } = await parseEntities(parsedFiles);

    // Show validation errors as toasts
    if (validationErrors && validationErrors.length > 0) {
      validationErrors.forEach(({ fileName, error }) => {
        addToast(`${fileName}: ${error}`, 'error', 8000);
      });
    }

    // Show success toast if entities were loaded
    const loadedCount = Object.keys(newEntities).length;
    if (loadedCount > 0) {
      addToast(`Successfully loaded ${loadedCount} entity schema${loadedCount > 1 ? 's' : ''}`, 'success', 4000);
      setEntities(newEntities, newRelations);
    } else if (validationErrors.length === 0) {
      addToast('No valid entity schemas found in uploaded files', 'warning', 5000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all entities?')) {
      clearEntities();
    }
  };

  const entityCount = Object.keys(entities).length;
  const relationCount = relations.length;

  // Center a specific entity in viewport
  const centerEntity = useCallback((entityName) => {
    if (reactFlowInstance.current) {
      const node = nodes.find((n) => n.id === entityName);
      if (node) {
        reactFlowInstance.current.setCenter(
          node.position.x + 150, // Approximate center of node
          node.position.y + 175,
          { zoom: 1, duration: 800 }
        );
      }
    }
  }, [nodes]);

  // Expose centerEntity function to parent components via ref
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.centerEntityInFlow = centerEntity;
    }
  }, [centerEntity]);

  return (
    <div className="entity-detail">
      <div className="entity-detail__header">
        <div className="entity-detail__info">
          <h2>Entity Relationship Diagram</h2>
          <div className="entity-detail__stats">
            <span className="stat-item">
              <strong>{entityCount}</strong> Entities
            </span>
            <span className="stat-item">
              <strong>{relationCount}</strong> Relations
            </span>
          </div>
        </div>
        <div className="entity-detail__actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.js"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={handleUploadClick}
          >
            Upload Schemas
          </Button>
          {entityCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="entity-detail__canvas">
        {entityCount === 0 ? (
          <div className="entity-detail__empty">
            <Upload style={{ fontSize: 64, color: '#ccc', marginBottom: 16 }} />
            <h3>No Entities Loaded</h3>
            <p>Upload entity schema files (JSON or JS) to visualize relationships</p>
            <Button
              variant="contained"
              size="large"
              startIcon={<Upload />}
              onClick={handleUploadClick}
              style={{ marginTop: 16 }}
            >
              Upload Entity Schemas
            </Button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            dragHandle=".drag-handle"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.className === 'focused') return '#ff9800';
                return '#667eea';
              }}
              nodeStrokeWidth={3}
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
