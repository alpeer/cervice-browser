'use client';

import { useState } from 'react';
import Collapsible from '@/ui/Collapsible/Collapsible';
import Tabs from '@/ui/Tabs/Tabs';
import Button from '@/ui/Button/Button';
import { AbstractEntity } from '@/lib/adapters/database/AbstractEntity';
import { TypeORMAdapter } from '@/lib/adapters/database/TypeORMAdapter';
import { SequelizeAdapter } from '@/lib/adapters/database/SequelizeAdapter';
import './EntitiesList.scss';

export default function EntitiesList({ spec }) {
  const [adapter, setAdapter] = useState('typeorm');
  const schemas = spec?.components?.schemas || {};
  const schemaNames = Object.keys(schemas).sort();

  if (schemaNames.length === 0) {
    return (
      <div className="entities-list">
        <p className="entities-list__empty">No schemas found to convert</p>
      </div>
    );
  }

  const handleDownloadAll = () => {
    const entities = schemaNames.map(name => {
      const schema = schemas[name];
      const entity = AbstractEntity.fromSchema(name, schema);

      if (adapter === 'typeorm') {
        const typeormEntity = new TypeORMAdapter(entity.name, entity.fields, entity.options);
        return typeormEntity.generateEntityCode();
      } else {
        const sequelizeEntity = new SequelizeAdapter(entity.name, entity.fields, entity.options);
        return sequelizeEntity.generateModelCode();
      }
    }).join('\n\n');

    const blob = new Blob([entities], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entities-${adapter}.js`;
    a.click();
  };

  return (
    <div className="entities-list">
      <h2>Database Entities</h2>
      <p className="entities-list__info">
        Convert OpenAPI schemas to database entities
      </p>

      <div className="entities-list__controls">
        <Tabs
          value={adapter}
          onChange={(e, newValue) => setAdapter(newValue)}
          tabs={[
            { label: 'TypeORM', value: 'typeorm' },
            { label: 'Sequelize', value: 'sequelize' },
          ]}
        />
        <Button onClick={handleDownloadAll}>
          Download All Entities
        </Button>
      </div>

      {schemaNames.map((name) => {
        const schema = schemas[name];
        const entity = AbstractEntity.fromSchema(name, schema);

        let adapterEntity;
        let code;

        if (adapter === 'typeorm') {
          adapterEntity = new TypeORMAdapter(entity.name, entity.fields, entity.options);
          code = adapterEntity.generateEntityCode();
        } else {
          adapterEntity = new SequelizeAdapter(entity.name, entity.fields, entity.options);
          code = adapterEntity.generateModelCode();
        }

        return (
          <Collapsible key={name} title={name}>
            <div className="entity-details">
              <div className="entity-details__info">
                <p><strong>Fields:</strong> {entity.getFieldNames().length}</p>
                <p><strong>Required:</strong> {entity.getRequiredFields().length}</p>
              </div>

              <div className="entity-details__code">
                <h4>Generated Code:</h4>
                <pre>
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
