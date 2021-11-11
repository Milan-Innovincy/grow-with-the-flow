import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { Map, Polygon, TileLayer, ImageOverlay, GeoJSON } from "react-leaflet";
import { range } from "lodash";
import { featureCollection, lineString, center } from "@turf/turf";
import { css } from "@emotion/css";
import { Fab, Select, MenuItem, Box, Tooltip, useTheme } from "@material-ui/core";
import { Grid, GridOff } from "mdi-material-ui";
import { InvertColors, InvertColorsOff} from "@material-ui/icons"
import { sortBy } from "lodash";
import { PNG } from "pngjs";
import chroma from "chroma-js";
import CoordinateCalculator from "./CoordinateCalculator";
import { FarmerData } from "./MapAndAnalytics";
import { blue } from "@material-ui/core/colors";

const { GeoJSONFillable, Patterns } = require("react-leaflet-geojson-patterns");

const parameters: any = {
  measuredPrecipitation: {
    slug: "measuredPrecipitation",
    label: "Neerslag",
    colors:["rgba(230, 244, 255, 0.01)", "#008dff"]
  },

  availableSoilWater: {
    slug: "availableSoilWater",
    label: "Beschikbaar vochtgehalte",
    colors: ["#fde3fd", "#f321c9"]
  },
  relativeTranspiration: {
    slug: "relativeTranspiration",
    label: "Waterstressfactor",
    colors: ["#107520", "#fcad03"]
  },
  evapotranspiration: {
    slug: "evapotranspiration",
    label: "Verdamping in mm",
    colors: ["#BECED1", "#6a7152"]
  },
};

const parametersPlot: any = {

  relativeTranspiration: {
    slug: "relativeTranspiration",
    label: "Droogtestress",
    colors: ["#008dff", "#b1dce4", "#ff5658"]
  },

  trafficability: {
    slug: "trafficability",
    label: "Berijdbaarheid",
    colors: ["#ff5658", "#BECED1", "#6a7152"]
  },
  
  availableSoilWater: {
    slug: "availableSoilWater",
    label: "Beschikbaar vochtgehalte",
    colors: ["#ff5658", "#b1dce4", "#008dff"]
  },

}

// const plotsChloropleth = {
//   slug: "relativeTranspiration",
//   label: "Droogtestres",
//   colors: {
//     min: "#107520",
//     max: "#ff5658",
//   },
// }

type Props = {
  navigate: (path: string) => void;
  farmerData: FarmerData;
  getPixelsData: () => void;
  farmerGeoData: any;
  date: string;
  selectedPlotId?: string;
  selectedPixel?: Array<number>;
};

let createPixelMap = (
  pixelsData: any,
  date: string,
  parameter: string,
  minValue: number,
  maxValue: number
) => {
  const grid = pixelsData.analytics.find((a: any) => a.time === date)[
    parameter
  ];
  const height = grid.length;
  const width = grid[0].length;
  const f = chroma
    .scale(parameters[parameter].colors).mode('lab')
    .domain([minValue, maxValue]);

  const png = new PNG({
    width,
    height,
  });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const value = grid[height - 1 - y][x];

      const rgba =
        typeof value === "number" && value !== -999 && value !== 0
          ? f(value).rgba()
          : [0, 0, 0, 0];
      png.data[idx] = rgba[0];
      png.data[idx + 1] = rgba[1];
      png.data[idx + 2] = rgba[2];
      png.data[idx + 3] = rgba[3] * 255;
    }
  }

  png.pack();

  const buffer = PNG.sync.write(png);
  const base64 = buffer.toString("base64");
  return `data:image/png;base64,${base64}`;
};

const getLegendColors = (parameter: string) => {
  const f = chroma
    .scale(parameters[parameter].colors).mode('lab')
    .domain([0, 500]);

  return [f(0).rgba(), f(250).rgba(), f(500).rgba()];
};

const getPlotLegendColors = (parameter: string) => {
  const f = chroma
    .scale(parametersPlot[parameter].colors).mode('lab')
    .domain([0, 500]);

  return [f(0).rgba(), f(250).rgba(), f(500).rgba()];
};


const MapView = ({
  navigate,
  date,
  farmerData,
  farmerGeoData,
  getPixelsData,
  selectedPlotId,
  selectedPixel,
}: Props) => {
  const theme = useTheme();
  const [selectedParameter, setSelectedParameter] = useState(
    "measuredPrecipitation"
  );
  const [selectedPlotParameter, setSelectedPlotParameter] = useState(
    "relativeTranspiration"
  );
  const [legendColors, setlegendColors] = useState(
    getLegendColors("measuredPrecipitation")
  );
  const [pixelSelection, setPixelSelection] = useState(selectedPixel && true);
  const [chloroplethSelection, setChloroplethSelection] = useState(true);
  const [zoom, setZoom] = useState(14);
  const [initialLoad, setInitialLoad] = useState(true);
  const [base64, setBase64] = useState("");

  let lng1: number = 0;
  let lat1: number = 0;
  let lng2: number = 0;
  let lat2: number = 0;
  let gridGeoJSON: object = {};
  let pixelLatStart: number = 0;
  let pixelLatEnd: number = 0;
  let pixelLngStart: number = 0;
  let pixelLngEnd: number = 0;
  let pixelLatStep: number = 0;
  let pixelLngStep: number = 0;

  if (farmerData.pixelsData) {
    const [pixelsInLng, pixelsInLat] = farmerData.pixelsData.dimensions;

    lng1 = farmerData.pixelsData.boundingBox[0];
    lat1 = farmerData.pixelsData.boundingBox[1];
    lng2 = farmerData.pixelsData.boundingBox[2];
    lat2 = farmerData.pixelsData.boundingBox[3];
    pixelLatStart = sortBy([lat1, lat2])[0];
    pixelLatEnd = sortBy([lat1, lat2])[1];
    pixelLngStart = sortBy([lng1, lng2])[0];
    pixelLngEnd = sortBy([lng1, lng2])[1];

    pixelLatStep = (pixelLatEnd - pixelLatStart) / pixelsInLat;
    pixelLngStep = (pixelLngEnd - pixelLngStart) / pixelsInLng;

    const pixelLats = [
      ...range(pixelLatStart, pixelLatEnd, pixelLatStep),
      pixelLatEnd,
    ];
    const pixelLngs = [
      ...range(pixelLngStart, pixelLngEnd, pixelLngStep),
      pixelLngEnd,
    ];

    gridGeoJSON = featureCollection([
      ...pixelLats.map((lat) =>
        lineString([
          [pixelLngStart, lat],
          [pixelLngEnd, lat],
        ])
      ),
      ...pixelLngs.map((lng) =>
        lineString([
          [lng, pixelLatStart],
          [lng, pixelLatEnd],
        ])
      ),
    ]);
  }

  const handleSelectedParameterChange = (event: any) => {
    setSelectedParameter(event.target.value);
  };

  const handleSelectedPlotParameterChange = (event: any) => {
    setSelectedPlotParameter(event.target.value);
  };

  const getCenter = () => {
    if (selectedPlotId) {
      const feature = farmerGeoData.plotsGeoJSON.features.find(
        (f: any) => f.properties.plotId === selectedPlotId
      );
      const c = center(feature).geometry!.coordinates;
      return {
        lat: c[1],
        lng: c[0],
      };
    }
    if (selectedPixel) {
      return {
        lat: pixelLatStart + selectedPixel[0] * pixelLatStep,
        lng: pixelLngStart + selectedPixel[1] * pixelLngStep,
      };
    }

    if (initialLoad) {
      const result = CoordinateCalculator.calculateBounds(
        farmerGeoData.plotsGeoJSON
      );
      setInitialLoad(false);
      return {
        lat: result.lat.avg,
        lng: result.lng.avg,
      };
    }

    return null;
  };

  const [mapCenter, setMapCenter] = useState(getCenter());

  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);

  useEffect(() => {
    const mapCenter = getCenter();
    setMapCenter(mapCenter as any);
  }, [selectedPlotId, selectedPixel]);

  useEffect(() => {
    if (
      farmerData && farmerData.pixelsData && pixelSelection &&
      farmerData.pixelsData.analytics.find((a: any) => a.time === date)
    ) {
      const minValue =
        farmerData.pixelsData.analytics[0][selectedParameter]
          .flat()
          .filter((x) => x !== 0).length === 0
          ? 0
          : farmerData.pixelsData.analytics[0][selectedParameter]
              .flat()
              .filter((x) => x !== 0)
              .reduce((prev, current) => Math.min(prev, current));

      const maxValue =
        farmerData.pixelsData.analytics[0][selectedParameter].flat().length ===
        0
          ? 0
          : farmerData.pixelsData.analytics[0][selectedParameter]
              .flat()
              .reduce((prev: any, current: any) => Math.max(prev, current));
      setMinValue(minValue);
      setMaxValue(maxValue);
      setBase64(
        createPixelMap(
          farmerData.pixelsData,
          date,
          selectedParameter,
          minValue,
          maxValue
        )
      );
      setlegendColors(getLegendColors(selectedParameter));
    } else if(farmerData && farmerData.plotsAnalytics && chloroplethSelection) {
      const minValue =
        Object.values(farmerData.plotsAnalytics).flat()
        .filter((x) => x.date === date).length === 0
        ? 0
        : Object.values(farmerData.plotsAnalytics)
            .flat()
            .filter((x) => x.date === date)
            .reduce((prev, current: any) => Math.min(prev, current[selectedPlotParameter]), 0);

      const maxValue =
        Object.values(farmerData.plotsAnalytics).flat()
        .filter((x) => x.date === date).length === 0
        ? 0
        : Object.values(farmerData.plotsAnalytics)
            .flat()
            .filter((x) => x.date === date)
            .reduce((prev, current: any) => Math.max(prev, current[selectedPlotParameter]), 0);
      
      setMinValue(minValue);
      setMaxValue(maxValue);
      setlegendColors(getPlotLegendColors(selectedPlotParameter))
      setBase64("");
    } else {
      setMinValue(null);
      setMaxValue(null);
      setBase64("");
    }
  }, [selectedParameter, selectedPlotParameter, date, selectedPixel, selectedPlotId, farmerData, pixelSelection, chloroplethSelection]);

  let pixelPolygon = undefined;
  if (selectedPixel) {
    const [latIndex, lngIndex] = selectedPixel;
    const lat1 = pixelLatStart + latIndex * pixelLatStep;
    const lat2 = lat1 + pixelLatStep;
    const lng1 = pixelLngStart + lngIndex * pixelLngStep;
    const lng2 = lng1 + pixelLngStep;
    pixelPolygon = (
      <Polygon
        positions={[
          [lat1, lng1],
          [lat1, lng2],
          [lat2, lng2],
          [lat2, lng1],
        ]}
        weight={2}
        fill={false}
      />
    );
  }

  let leafletElement = undefined;

  if (!farmerData && farmerGeoData) {
    return (
      <Map
        center={mapCenter as any}
        zoom={zoom}
        onzoomend={(e: any) => setZoom(e.target.getZoom())}
        className={css`
          height: 100%;
          .leaflet-control-zoom {
            border-radius: 17px;
            left: 14px;
          }
          .leaflet-control-zoom-in {
            border-radius: 17px 17px 0 0 !important;
          }
          .leaflet-control-zoom-out {
            border-radius: 0 0 17px 17px !important;
          }
        `}
        ref={(map: any) => (leafletElement = map && map!.leafletElement)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
      </Map>
    );
  }

  return (
    <div className={css`
      position:relative;
      height: 100%;
    `}>
      <Map
        center={mapCenter as any}
        zoom={zoom}
        onzoomend={(e: any) => setZoom(e.target.getZoom())}
        className={css`
          height: 100%;
          .leaflet-control-zoom {
            border-radius: 17px;
            left: 14px;
          }
          .leaflet-control-zoom-in {
            border-radius: 17px 17px 0 0 !important;
          }
          .leaflet-control-zoom-out {
            border-radius: 0 0 17px 17px !important;
          }
        `}
        //ref={(map: any) => (leafletElement = map && map!.leafletElement)}
        onclick={(e: any) => {
          if (pixelSelection) {
            const { lat, lng } = e.latlng;
            if (
              lat >= pixelLatStart &&
              lat <= pixelLatEnd &&
              lng >= pixelLngStart &&
              lng <= pixelLngEnd
            ) {
              const pixelLat = Math.floor((lat - pixelLatStart) / pixelLatStep);
              const pixelLng = Math.floor((lng - pixelLngStart) / pixelLngStep);
              navigate(`/map/${date}/pixel/${pixelLat}-${pixelLng}`);
            }
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        <ImageOverlay
          url={base64}
          bounds={[
            [lat1, lng1],
            [lat2, lng2],
          ]}
          opacity={pixelSelection ? 0.5 : 0}
        />
        {
          farmerData.pixelsData && 
          <GeoJSON
            data={gridGeoJSON as GeoJSON.FeatureCollection}
            weight={1}
            color={pixelSelection && zoom >= 13 ? "#e0e0e0" : "transparent"}
          />
        }
        
        {pixelPolygon}
        <GeoJSONFillable
          data={farmerData.plotsGeoJSON}
          style={(feature: any) => {
            const selectionStyle =
              feature.properties.plotId === selectedPlotId
                ? {
                    weight: 2,
                    color: "#1976d2",
                  }
                : {
                    weight: 1,
                    color: "#64b5f6",
                  };

            if(chloroplethSelection && !pixelSelection){
              const f = chroma
              .scale(parametersPlot[selectedPlotParameter].colors).mode('lab')
              .domain([minValue as number, maxValue as number]);

              let chloropleth = {}
              if(farmerData.plotsAnalytics.hasOwnProperty(feature.properties.plotId)){
                let todayValue: any = farmerData.plotsAnalytics[feature.properties.plotId].find((x) => x.date === date);
                if(todayValue && todayValue.hasOwnProperty(selectedPlotParameter)){
                  let color = f(todayValue[selectedPlotParameter] || 0).rgba();
                  if(todayValue) {
                    chloropleth = {
                    
                      fillColor: `rgba(${color[0]},${color[1]},${color[2]},0.9)`,
                      color: `rgba(${color[0] - 40},${color[1] + 5},${color[2]},1)`,
                      weight: feature.properties.plotId === selectedPlotId ? 3 : 1,
                    }
                  }
                }
              }
              return {
                fillOpacity: 1,
                fillPattern: undefined,
                ...chloropleth,
              }
              
            } else {
              return {
                fillPattern: Patterns.StripePattern({
                  color: "#00acc1",
                  weight: 3,
                  spaceColor: "#80deea",
                  spaceOpacity: 1,
                  key: "stripe",
                }),
                ...selectionStyle,
              };
            }
          }}
          onClick={(e: any) =>
            navigate(`/map/${date}/plot/${e.layer.feature.properties.plotId}`)
          }
        />
        
      </Map>
      <div
        className={css`
          display: flex;
          position: absolute !important;
          z-index: 1000;
          top: 10px;
          right: 24px;
          gap: 15px;
        `}
      >
        {pixelSelection ?
        <div
          className={css`
            display: flex;
            align-items: center;
            height: 48px;
            margin-right: 15px;
            padding: 0px 15px;
            background-color: #d5d5d5;
            border-radius: 4px;
          `}
        >
          
          <Select
            className={css``}
            value={selectedParameter}
            onChange={handleSelectedParameterChange}
            autoWidth={true}
          >
            {Object.keys(parameters).map((parameterName: string) => (
              <MenuItem key={parameterName} value={parameterName}>
                {parameters[parameterName].label}
              </MenuItem>
            ))}
          </Select>
        </div>
        :
        <>
          {chloroplethSelection &&
            <div
              className={css`
                display: flex;
                align-items: center;
                height: 48px;
                padding: 0px 15px;
                background-color: ${theme.palette.secondary.main};
                border-radius: 4px;
              `}
            >
              <Select
                value={selectedPlotParameter}
                onChange={handleSelectedPlotParameterChange}
                autoWidth={true}
                color="secondary"
              >
                {Object.keys(parametersPlot).map((parameterName: string) => (
                  <MenuItem key={parameterName} value={parameterName}>
                    {parametersPlot[parameterName].label}
                  </MenuItem>
                ))}
              </Select>
            </div>  
          }
          <Tooltip title={chloroplethSelection ? "Hide chloropleth" : "Show chloropleth"}>
            <Fab
              color="secondary"
              onClick={() => setChloroplethSelection(!chloroplethSelection)}
              size="medium"
              disableFocusRipple={true}
            >
              {chloroplethSelection ? <InvertColorsOff /> : <InvertColors />}
            </Fab>
          </Tooltip>
        </>
        }
        {/* <Tooltip title={pixelSelection ? "Hide grid" : "Show grid"}>
          <Fab
            color="secondary"
            onClick={() => {
              if(farmerData.pixelsData === undefined){
                getPixelsData()
              }
              setPixelSelection(!pixelSelection)
            }}
            size="medium"
            disableFocusRipple={true}
          >
            {pixelSelection ? <GridOff /> : <Grid />}
          </Fab>
        </Tooltip> */}
      </div>

      {(pixelSelection || chloroplethSelection) &&
        <Box
          className={css`
            display: flex;
            align-items: center;
            position: absolute !important;
            padding: 4px 6px;
            z-index: 1000;
            background-color: #fff;
            bottom: 24px;
            right: 24px;
            border-radius: 4px;
          `}
        >
          <small
            className={css`
              padding-right: 5px;
              color: rgba(0, 0, 0, 0.87);
            `}
          >
            Min. (
            {minValue &&
              minValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            )
          </small>
          <div
            className={css`
              background-color: rgba(
                ${legendColors[0][0]},
                ${legendColors[0][1]},
                ${legendColors[0][2]},
                ${legendColors[0][3]}
              );
              width: 30px;
              height: 20px;
            `}
          ></div>
          <div
            className={css`
              background-color: rgba(
                ${legendColors[1][0]},
                ${legendColors[1][1]},
                ${legendColors[1][2]},
                ${legendColors[1][3]}
              );
              width: 30px;
              height: 20px;
            `}
          ></div>
          <div
            className={css`
              background-color: rgba(
                ${legendColors[2][0]},
                ${legendColors[2][1]},
                ${legendColors[2][2]},
                ${legendColors[2][3]}
              );
              width: 30px;
              height: 20px;
            `}
          ></div>
          <small
            className={css`
              padding-left: 5px;
              color: rgba(0, 0, 0, 0.87);
            `}
          >
            Max. (
            {maxValue &&
              maxValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            )
          </small>
        </Box>
      }
    </div>
  );
};

export default MapView;
