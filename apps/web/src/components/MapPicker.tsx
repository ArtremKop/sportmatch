import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

// default marker icons don't load from vite without this
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickSet({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number) => void;
  markers?: { lat: number; lng: number; label?: string }[];
};

export function MapPicker({ lat, lng, onChange, markers }: Props) {
  return (
    <div className="h-64 rounded-lg overflow-hidden border border-slate-200">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onChange && <ClickSet onPick={onChange} />}
        {(!markers || markers.length === 0) && <Marker position={[lat, lng]} />}
        {markers?.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} />
        ))}
      </MapContainer>
    </div>
  );
}
