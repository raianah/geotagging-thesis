import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "../css/Sidebar.css";
import L from "leaflet";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

const API_KEY = "5b3ce3597851110001cf624839aba6e307244399801a76ec477ab2d5";

// Locations
const initialCustomerLocation = [14.3294, 120.9366]; // SM Dasmarinas, Cavite
const hogOwnerLocations = [
  [13.9374, 120.7335], // Balayan 1
  [13.9395, 120.7412], // Balayan 2
];

const customerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: markerShadow,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [1, -40],
  });
  
  // Shop Icon (Red)
  const shopIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: markerShadow,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [1, -40],
  });

const getTrafficColor = (distance) => {
  if (distance < 500) return "green"; // Fast
  if (distance < 1500) return "yellow"; // Moderate
  return "red"; // Heavy traffic
};

const ShortestPathMap = () => {
  const [customerLocation] = useState(initialCustomerLocation);
  const [selectedShop, setSelectedShop] = useState(null);
  const [route, setRoute] = useState([]);
  const [altRoutes, setAltRoutes] = useState([]);
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRoute = async (shopLocation) => {
    setLoading(true);
    setErrorMsg("");
    setRoute([]);
    setAltRoutes([]);
    setDirections([]);

    try {
      console.log("Fetching route from:", customerLocation, "to", shopLocation);

      const response = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          coordinates: [
            [customerLocation[1], customerLocation[0]], // Start (Lon, Lat)
            [shopLocation[1], shopLocation[0]], // End (Lon, Lat)
          ],
          alternative_routes: {
            target_count: 2, // Request 2 alternative routes
            weight_factor: 1.2, // Adjust for different paths
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data || !response.data.features || response.data.features.length === 0) {
        throw new Error("Invalid API response. No route data found.");
      }

      // Extract main route
      const mainRouteCoords = response.data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      setRoute(mainRouteCoords);

      // Extract alternative routes
      const altRoutesData = response.data.features.slice(1).map(feature =>
        feature.geometry.coordinates.map(coord => [coord[1], coord[0]])
      );
      setAltRoutes(altRoutesData);

      // Get directions for the main route
      const steps = response.data.features[0].properties.segments[0].steps;
      setDirections(steps);
    } catch (error) {
      console.error("Error fetching route:", error);
      setErrorMsg("Failed to fetch route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-container">
        <div className="traffic-legend">
            <span className="legend-item"><span className="color-box green"></span> Fast</span>
            <span className="legend-item"><span className="color-box yellow"></span> Moderate</span>
            <span className="legend-item"><span className="color-box red"></span> Heavy Traffic</span>
            <span className="legend-item"><span className="color-box blue"></span> Alternative Route</span>
        </div>
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Route Directions</h2>
        {loading && <p>Loading route...</p>}
        {errorMsg && <p className="error">{errorMsg}</p>}
        {directions.length > 0 ? (
          <ol>
            {directions.map((step, index) => (
              <li key={index}>
                {step.instruction} <br />
                <small>{(step.distance / 1000).toFixed(2)} KM</small>
              </li>
            ))}
          </ol>
        ) : (
          <p>Select a hog shop to view directions.</p>
        )}
      </div>

      {/* Map */}
      <MapContainer className="map" center={customerLocation} zoom={13}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Customer Location */}
        <Marker position={customerLocation} icon={customerIcon}>
            <Popup>📍 Customer Location (SM Dasmarinas)</Popup>
        </Marker>

        {/* Hog Owner Locations */}
        {hogOwnerLocations.map((location, index) => (
          <Marker
            key={index}
            position={location}
            icon={shopIcon}
            eventHandlers={{
              click: () => {
                setSelectedShop(location);
                fetchRoute(location);
              },
            }}
          >
            <Popup>🏠 Hog Owner Shop {index + 1}</Popup>
          </Marker>
        ))}

        {/* Draw Main Route with Traffic Colors */}
        {route.length > 1 &&
          route.map((coord, index) => {
            if (index === route.length - 1) return null;
            return (
              <Polyline
                key={`main-${index}`}
                positions={[coord, route[index + 1]]}
                color={getTrafficColor(directions[index]?.distance || 1000)}
                weight={6}
              />
            );
          })}

        {/* Draw Alternative Routes (Disappear when merging with Main Route) */}
        {altRoutes.map((altRoute, altIndex) =>
          altRoute.map((coord, index) => {
            if (index === altRoute.length - 1) return null;

            // Check if alt route segment exists in main route to remove overlap
            const isOverlapping = route.some((rCoord) => rCoord[0] === coord[0] && rCoord[1] === coord[1]);
            if (isOverlapping) return null;

            return (
              <Polyline
                key={`alt-${altIndex}-${index}`}
                positions={[coord, altRoute[index + 1]]}
                color="blue" // Alternative route color
                weight={2}
                dashArray="5, 10" // Short dash, large gap for visibility
                lineCap="butt"
                lineJoin="miter"
              />
            );
          })
        )}
      </MapContainer>
    </div>
  );
};

export default ShortestPathMap;
