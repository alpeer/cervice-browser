import Ajv from 'ajv';
import { detectVersion } from '@/utils/versionDetector';
import { loadSchema } from '@/utils/schemaLoader';

const ajv = new Ajv({ allErrors: true });

export async function POST(request) {
  try {
    const { spec } = await request.json();

    if (!spec) {
      return Response.json(
        { valid: false, errors: ['No spec provided'] },
        { status: 400 }
      );
    }

    // Detect version and load appropriate schema
    const { version, schemaVersion, isSwagger } = await detectVersion(spec);
    const schema = await loadSchema(schemaVersion);

    // Validate spec against schema
    const validate = ajv.compile(schema);
    const valid = validate(spec);

    if (!valid) {
      return Response.json({
        valid: false,
        version,
        schemaVersion,
        isSwagger,
        errors: validate.errors.map(err => ({
          path: err.instancePath,
          message: err.message,
          params: err.params,
        })),
      });
    }

    return Response.json({
      valid: true,
      version,
      schemaVersion,
      isSwagger,
      errors: [],
    });
  } catch (error) {
    return Response.json(
      { valid: false, errors: [error.message] },
      { status: 500 }
    );
  }
}
