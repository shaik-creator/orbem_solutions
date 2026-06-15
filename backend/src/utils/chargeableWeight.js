function calculateChargeableWeight({ actual_weight, length_cm, width_cm, height_cm, package_count }) {
  const actual = Number(actual_weight || 0);
  const length = Number(length_cm || 0);
  const width = Number(width_cm || 0);
  const height = Number(height_cm || 0);
  const packages = Number(package_count || 1);
  const volumetric = (length * width * height * packages) / 6000;

  return {
    volumetric_weight: Number(volumetric.toFixed(2)),
    chargeable_weight: Number(Math.max(actual, volumetric).toFixed(2))
  };
}

module.exports = {
  calculateChargeableWeight
};
