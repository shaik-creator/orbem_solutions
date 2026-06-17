let warnedAboutJwtSecret = false;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret !== 'change_this_secret') return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured before running in production.');
  }

  if (!warnedAboutJwtSecret) {
    console.warn('JWT_SECRET is using a development fallback. Set a strong value in backend/.env before deployment.');
    warnedAboutJwtSecret = true;
  }

  return 'orbem_development_jwt_secret';
}

module.exports = {
  getJwtSecret
};
