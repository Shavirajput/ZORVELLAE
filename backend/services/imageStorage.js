'use strict';

const MAX_IMAGE_URL_LENGTH = 2048;

function normalizeHttpsImageReference(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Image URL must be a string.');
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_IMAGE_URL_LENGTH) {
    throw new TypeError('Image URL is required and must be 2048 characters or fewer.');
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new TypeError('Image reference must be an absolute HTTPS URL.');
  }

  if (
    url.protocol !== 'https:' ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.endsWith('.local')
  ) {
    throw new TypeError(
      'Images must use HTTPS URLs; local upload paths are not supported.',
    );
  }

  return url.toString();
}

module.exports = { normalizeHttpsImageReference };
