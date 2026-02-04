/**
 * Hash domain separator for SNIP-12
 *
 * The domain is a special struct that identifies the application.
 */

import type { Felt252Type } from '../../primitives/index.js';
import { hashStruct } from './hashStruct.js';
import { Snip12InvalidDomainError } from './errors.js';
import type { Domain, TypeDefinitions, TypeProperty } from './types.js';

/**
 * StarknetDomain type definition (revision 1)
 */
const STARKNET_DOMAIN_TYPE: readonly TypeProperty[] = [
  { name: 'name', type: 'shortstring' },
  { name: 'version', type: 'shortstring' },
  { name: 'chainId', type: 'shortstring' },
  { name: 'revision', type: 'shortstring' },
];

/**
 * Hash the domain separator
 *
 * @param domain - The domain object
 * @returns The domain hash as Felt252
 */
export function hashDomain(domain: Domain): Felt252Type {
  // Validate domain fields
  validateDomain(domain);

  // Build type definition with only present fields
  const typeProps: TypeProperty[] = [];
  const domainData: Record<string, string> = {};

  if (domain.name !== undefined) {
    typeProps.push({ name: 'name', type: 'shortstring' });
    domainData.name = domain.name;
  }
  if (domain.version !== undefined) {
    typeProps.push({ name: 'version', type: 'shortstring' });
    domainData.version = domain.version;
  }
  if (domain.chainId !== undefined) {
    typeProps.push({ name: 'chainId', type: 'shortstring' });
    domainData.chainId = domain.chainId;
  }
  if (domain.revision !== undefined) {
    typeProps.push({ name: 'revision', type: 'shortstring' });
    domainData.revision = domain.revision;
  }

  // Create types with the dynamic domain type
  const types: TypeDefinitions = {
    StarknetDomain: typeProps,
  };

  return hashStruct('StarknetDomain', domainData, types);
}

/**
 * Validate domain fields
 */
function validateDomain(domain: Domain): void {
  const validFields = new Set(['name', 'version', 'chainId', 'revision']);

  for (const key of Object.keys(domain)) {
    if (!validFields.has(key)) {
      throw new Snip12InvalidDomainError(`Unknown domain field: ${key}`, {
        field: key,
        validFields: [...validFields],
      });
    }
  }

  if (domain.name !== undefined && typeof domain.name !== 'string') {
    throw new Snip12InvalidDomainError("'name' must be a string", {
      name: domain.name,
    });
  }

  if (domain.version !== undefined && typeof domain.version !== 'string') {
    throw new Snip12InvalidDomainError("'version' must be a string", {
      version: domain.version,
    });
  }

  if (domain.chainId !== undefined && typeof domain.chainId !== 'string') {
    throw new Snip12InvalidDomainError("'chainId' must be a string", {
      chainId: domain.chainId,
    });
  }

  if (domain.revision !== undefined && typeof domain.revision !== 'string') {
    throw new Snip12InvalidDomainError("'revision' must be a string", {
      revision: domain.revision,
    });
  }

  // Validate shortstring lengths
  if (domain.name && domain.name.length > 31) {
    throw new Snip12InvalidDomainError("'name' must be <= 31 characters", {
      name: domain.name,
      length: domain.name.length,
    });
  }
  if (domain.version && domain.version.length > 31) {
    throw new Snip12InvalidDomainError("'version' must be <= 31 characters", {
      version: domain.version,
      length: domain.version.length,
    });
  }
  if (domain.chainId && domain.chainId.length > 31) {
    throw new Snip12InvalidDomainError("'chainId' must be <= 31 characters", {
      chainId: domain.chainId,
      length: domain.chainId.length,
    });
  }
  if (domain.revision && domain.revision.length > 31) {
    throw new Snip12InvalidDomainError("'revision' must be <= 31 characters", {
      revision: domain.revision,
      length: domain.revision.length,
    });
  }
}
