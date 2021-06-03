import React, { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { Map, Polygon, TileLayer, ImageOverlay, GeoJSON } from 'react-leaflet'
import { range } from 'lodash'
import { featureCollection, lineString, center } from '@turf/turf'
import { css } from '@emotion/css'
import { Fab, Select, MenuItem, Box } from '@material-ui/core'
import { Grid, GridOff } from 'mdi-material-ui'
import { sortBy } from 'lodash'
import { PNG } from 'pngjs'
import chroma from 'chroma-js'
import CoordinateCalculator from "./CoordinateCalculator";
import { FarmerData } from './MapAndAnalytics'
const { GeoJSONFillable, Patterns } = require('react-leaflet-geojson-patterns')

const parameters: object = {
  measuredPrecipitation: {
    slug: 'measuredPrecipitation',
    label: 'Neerslag',
    colors: {
      min: 'rgba(230, 244, 255, 0.01)',
      max: '#008dff'
    }
  },
  deficit: {
    slug: 'deficit',
    label: 'Vochttekort',
    colors: {
      min: '#FFE3D3',
      max: '#F6511D'
    }
  },
  availableSoilWater: {
    slug: 'availableSoilWater',
    label: 'Beschikbaar vochtgehalte',
    colors: {
      min: '#fde3fd',
      max: '#f321c9'
    }
  },
  relativeTranspiration: {
    slug: 'relativeTranspiration',
    label: 'Waterstressfactor',
    colors: {
      min: '#107520',
      max: '#fcad03'
    }
  },
  evapotranspiration: {
    slug: 'evapotranspiration',
    label: 'Verdamping in mm',
    colors: {
      min: '#BECED1',
      max: '#6a7152'
    }
  }
}

type Props = {
  navigate: (path: string) => void
  farmerData: FarmerData
  farmerGeoData: any
  date: string
  selectedPlotId?: string
  selectedPixel?: Array<number>
}

let createPixelMap = (pixelsData: any, date: string, parameter: string, minValue: number, maxValue: number) => {
  const grid = pixelsData.analytics.find((a: any) => a.time === date)[parameter]
  const height = grid.length
  const width = grid[0].length

  const f = chroma
    .scale([parameters[parameter].colors.min, parameters[parameter].colors.max])
    .domain([minValue, maxValue])

  const png = new PNG({
    width,
    height
  })

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2
      const value = grid[height - 1 - y][x]

      const rgba = (typeof (value) === 'number' && value !== -999) ? f(value).rgba() : [0, 0, 0, 0]
      png.data[idx] = rgba[0]
      png.data[idx + 1] = rgba[1]
      png.data[idx + 2] = rgba[2]
      png.data[idx + 3] = rgba[3] * 255
    }
  }

  png.pack()

  const buffer = PNG.sync.write(png)
  const base64 = buffer.toString('base64')
  return `data:image/png;base64,${base64}`
}

const getLegendColors = (parameter: string) => {
  const f = chroma.scale([parameters[parameter].colors.min, parameters[parameter].colors.max]).domain([0, 500])

  return [f(0).rgba(), f(250).rgba(), f(500).rgba()]
}

const MapView = ({ navigate, date, farmerData, farmerGeoData, selectedPlotId, selectedPixel }: Props) => {
  const [selectedParameter, setSelectedParameter] = useState('deficit')
  const [legendColors, setlegendColors] = useState(getLegendColors(selectedParameter))
  const [pixelSelection, setPixelSelection] = useState(false)
  const [zoom, setZoom] = useState(14)
  const [initialLoad, setInitialLoad] = useState(true)
  const [base64, setBase64] = useState('')

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

  if (farmerData) {
    const [pixelsInLng, pixelsInLat] = farmerData.pixelsData.dimensions

    lng1 = farmerData.pixelsData.boundingBox[0]
    lat1 = farmerData.pixelsData.boundingBox[1]
    lng2 = farmerData.pixelsData.boundingBox[2]
    lat2 = farmerData.pixelsData.boundingBox[3]
    pixelLatStart = sortBy([lat1, lat2])[0]
    pixelLatEnd = sortBy([lat1, lat2])[1]
    pixelLngStart = sortBy([lng1, lng2])[0]
    pixelLngEnd = sortBy([lng1, lng2])[1]

    pixelLatStep = (pixelLatEnd - pixelLatStart) / pixelsInLat
    pixelLngStep = (pixelLngEnd - pixelLngStart) / pixelsInLng

    const pixelLats = [...range(pixelLatStart, pixelLatEnd, pixelLatStep), pixelLatEnd]
    const pixelLngs = [...range(pixelLngStart, pixelLngEnd, pixelLngStep), pixelLngEnd]

    gridGeoJSON = featureCollection([
      ...pixelLats.map(lat =>
        lineString([[pixelLngStart, lat], [pixelLngEnd, lat]])
      ),
      ...pixelLngs.map(lng =>
        lineString([[lng, pixelLatStart], [lng, pixelLatEnd]])
      )
    ])
  }

  const handleSelectedParameterChange = (event: any) => {
    setSelectedParameter(event.target.value)
  }

  const getCenter = () => {
    if (selectedPlotId) {
      const feature = farmerGeoData.plotsGeoJSON.features.find((f: any) => f.properties.plotId === selectedPlotId)
      const c = center(feature).geometry!.coordinates
      return {
        lat: c[1],
        lng: c[0]
      }
    }
    if (selectedPixel) {
      return {
        lat: pixelLatStart + selectedPixel[0] * pixelLatStep,
        lng: pixelLngStart + selectedPixel[1] * pixelLngStep
      }
    }

    if (initialLoad) {
      const result = CoordinateCalculator.calculateBounds(farmerGeoData.plotsGeoJSON);
      setInitialLoad(false);
      return {
        lat: result.lat.avg,
        lng: result.lng.avg
      }
    }

    return null;
  }

  const [mapCenter, setMapCenter] = useState(getCenter());

  const [minValue, setMinValue] = useState();
  const [maxValue, setMaxValue] = useState();

  useEffect(() => {
    const mapCenter = getCenter()
    setMapCenter(mapCenter as any)
  }, [selectedPlotId, selectedPixel])

  useEffect(() => {

    if (farmerData) {
      const minValue = farmerData.pixelsData.analytics[0][selectedParameter].flat().reduce((prev, current) => Math.min(prev, current));
      const maxValue = farmerData.pixelsData.analytics[0][selectedParameter].flat().reduce((prev, current) => Math.max(prev, current));
      setMinValue(minValue);
      setMaxValue(maxValue);
      setBase64(createPixelMap(farmerData.pixelsData, date, selectedParameter, minValue, maxValue));
      setlegendColors(getLegendColors(selectedParameter))
    }
  }, [selectedParameter])

  let pixelPolygon = undefined;
  if (selectedPixel) {
    const [latIndex, lngIndex] = selectedPixel
    const lat1 = pixelLatStart + latIndex * pixelLatStep
    const lat2 = lat1 + pixelLatStep
    const lng1 = pixelLngStart + lngIndex * pixelLngStep
    const lng2 = lng1 + pixelLngStep
    pixelPolygon =
      <Polygon
        positions={[[lat1, lng1], [lat1, lng2], [lat2, lng2], [lat2, lng1]]}
        weight={2}
        fill={false}
      />
  }

  let leafletElement = undefined

  const legendStyle = {
    background: legendColors[0]
  }

  if (!farmerData && farmerGeoData) {
    return (
      <Map
        center={mapCenter as any}
        zoom={zoom}
        onzoomend={(e: any) => setZoom(e.target.getZoom())}
        className={css`
          height: 100%;
          .leaflet-interactive,
          .leaflet-interactive:hover {
            fill-opacity: 0.4 !important;
          }
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
        ref={(map: any) => leafletElement = map && map!.leafletElement}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
      </Map>
    )
  }

  return (
    <>
      <Map
        center={mapCenter as any}
        zoom={zoom}
        onzoomend={(e: any) => setZoom(e.target.getZoom())}
        className={css`
          height: 100%;
          .leaflet-interactive,
          .leaflet-interactive:hover {
            fill-opacity: 0.4 !important;
          }
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
        ref={(map: any) => leafletElement = map && map!.leafletElement}
        onclick={(e: any) => {
          if (pixelSelection) {
            const { lat, lng } = e.latlng
            if (lat >= pixelLatStart && lat <= pixelLatEnd && lng >= pixelLngStart && lng <= pixelLngEnd) {
              const pixelLat = Math.floor((lat - pixelLatStart) / pixelLatStep)
              const pixelLng = Math.floor((lng - pixelLngStart) / pixelLngStep)
              navigate(`/map/${date}/pixel/${pixelLat}-${pixelLng}`)
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
          bounds={[[lat1, lng1], [lat2, lng2]]}
          opacity={pixelSelection ? 0.5 : 0}
        />
        <GeoJSON
          data={gridGeoJSON as GeoJSON.FeatureCollection}
          weight={1}
          color={(pixelSelection && zoom >= 13) ? '#e0e0e0' : 'transparent'}
        />
        {pixelPolygon}
        <GeoJSONFillable
          data={farmerData.plotsGeoJSON}
          style={(feature: any) => {
            const selectionStyle = feature.properties.plotId === selectedPlotId ? {
              weight: 2,
              color: '#1976d2'
            } : {
              weight: 1,
              color: '#64b5f6'
            }
            return {
              fillPattern: Patterns.StripePattern({
                color: '#00acc1',
                weight: 3,
                spaceColor: '#80deea',
                spaceOpacity: 1,
                key: 'stripe'
              }),
              ...selectionStyle
            }
          }}
          onClick={(e: any) => navigate(`/map/${date}/plot/${e.layer.feature.properties.plotId}`)}
        />
      </Map>
      <div
        className={css`
          display: flex;
          position: absolute !important;
          z-index: 1000;
          top: 10px;
          right: 24px;
        `}
      >
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
            className={css`
            `}
            value={selectedParameter}
            onChange={handleSelectedParameterChange}
            autoWidth={true}
          >
            {
              Object.keys(parameters).map((parameterName: string) =>
                <MenuItem key={parameterName} value={parameterName}>{parameters[parameterName].label}</MenuItem>
              )
            }
          </Select>
        </div>
        <Fab
          onClick={() => setPixelSelection(!pixelSelection)}
          size="medium"
          disableFocusRipple={true}
        >
          {pixelSelection ? <GridOff /> : <Grid />}
        </Fab>
      </div>

      {pixelSelection ? <Box
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
        <small className={css`padding-right: 5px; color: rgba(0, 0, 0, 0.87);`}>Min. ({minValue && minValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })})</small>
        <div className={css`
          background-color: rgba(${legendColors[0][0]}, ${legendColors[0][1]}, ${legendColors[0][2]}, ${legendColors[0][3]});
          width: 30px;
          height: 20px;`}></div>
        <div className={css`
          background-color: rgba(${legendColors[1][0]}, ${legendColors[1][1]}, ${legendColors[1][2]}, ${legendColors[1][3]});
          width: 30px;
          height: 20px;`}></div>
        <div className={css`
          background-color: rgba(${legendColors[2][0]}, ${legendColors[2][1]}, ${legendColors[2][2]}, ${legendColors[2][3]});
          width: 30px;
          height: 20px;`}></div>
        <small className={css`padding-left: 5px; color: rgba(0, 0, 0, 0.87);`}>Max. ({maxValue && maxValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })})</small>
      </Box> : null}
    </>
  )
}

export default MapView