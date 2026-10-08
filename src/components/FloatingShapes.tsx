import React from 'react';

export const FloatingShapes: React.FC = () => {
  return (
    <>
      <div className="bg-overlay" />
      <i className="fas fa-shield-alt floating-shape shape-one" aria-hidden="true" />
      <i className="fas fa-chart-line floating-shape shape-two" aria-hidden="true" />
      <i className="fas fa-user-graduate floating-shape shape-three" aria-hidden="true" />
    </>
  );
};
