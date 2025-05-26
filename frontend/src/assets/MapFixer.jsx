import { useEffect } from "react";
import { useMap } from "react-leaflet";

const MapFixer = () => {
    const map = useMap();
    
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize(); // Force Leaflet to recalculate size
        }, 100);
    }, [map]);

    return null;
};

export default MapFixer;