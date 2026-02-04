import React from 'react';
import { Polygon } from 'react-native-maps';
import { buildings } from '../data/buildings';

export default function BuildingPolygon({onSelectBuilding}){
    return (
        <>
        {buildings.map(b => (
            <Polygon
                key={b.id}
                coordinates={b.coordinates}
                strokeColor="#FF0000"
                fillColor="rgba(255,0,0,0.4)"
                strokeWidth={2}
                onPress={() => onSelectBuilding(b)}
                tappable
          />
        ))}
        </>
    )
}