import React, { useEffect, useRef } from 'react';

const GoogleMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (window.google) {
      new window.google.maps.Map(mapRef.current, {
        center: { lat: -34.397, lng: 150.644 }, // Default location
        zoom: 8,
      });
    }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default GoogleMap;
