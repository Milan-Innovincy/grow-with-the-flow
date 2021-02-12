import React, { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { Map, Polygon, TileLayer, ImageOverlay, GeoJSON } from 'react-leaflet'
import { range } from 'lodash'
import { featureCollection, lineString, center } from '@turf/turf'
import { css } from '@emotion/css'
import { Fab, Select, MenuItem, FormControl, Box } from '@material-ui/core'
import { Grid, GridOff } from 'mdi-material-ui'
import { sortBy } from 'lodash'
import { PNG } from 'pngjs'
import chroma from 'chroma-js'
import CoordinateCalculator from "./CoordinateCalculator";
const { GeoJSONFillable, Patterns } = require('react-leaflet-geojson-patterns')

const parameters: {
  slug: string,
  label: string,
  colors: {
    min: string,
    max: string
  }
}[] = [
  {
    slug: 'measuredPrecipitation',
    label: 'Measured preciitation',
    colors: {
      min: '#e3f2fd',
      max: '#2196f3'
    }
  },
  {
    slug: 'deficit',
    label: 'Deficit',
    colors: {
      min: '#e3f2fd',
      max: '#2196f3'
    }
  },
  {
    slug: 'availableSoilWater',
    label: 'Available soilwater',
    colors: {
      min: '#e3f2fd',
      max: '#2196f3'
    }
  },
  {
    slug: 'desiredSoilWater',
    label: 'Desired soilwater',
    colors: {
      min: '#e3f2fd',
      max: '#2196f3'
    }
  },
  {
    slug: 'evapotranspiration',
    label: 'Evapotranspiration',
    colors: {
      min: '#e3f2fd',
      max: '#2196f3'
    }
  }
]

type Props = {
  navigate: (path: string) => void
  farmerData: any
  date: string
  selectedPlotId?: string
  selectedPixel?: Array<number>
}

let createPixelMap = (pixelsData: any, date: string, parameter: string) => {
  const deficitGrid = pixelsData.analytics.find((a: any) => a.time === date).deficit
  const height = deficitGrid.length
  const width = deficitGrid[0].length

  const f = chroma.scale(['#e3f2fd', '#2196f3']).domain([0, 500])
  const png = new PNG({
    width,
    height
  })
  
  for(let y = 0; y < height; y++) {
    for(let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2
      const value = deficitGrid[height-1-y][x]
      const rgba = (typeof(value) === 'number') ? f(value).rgba() : [0,0,0,0]
      png.data[idx  ] = rgba[0]
      png.data[idx+1] = rgba[1]
      png.data[idx+2] = rgba[2]
      png.data[idx+3] = rgba[3] * 255
    }
  }

  png.pack()

  const buffer = PNG.sync.write(png)
  const base64 = buffer.toString('base64')
  return `data:image/png;base64,${base64}`
}

const MapView = ({ navigate, date, farmerData, selectedPlotId, selectedPixel }: Props) => {
  const [ selectedParameter, setSelectedParameter ] = useState('deficit')
  const [ pixelSelection, setPixelSelection ] = useState(false)
  const [ zoom, setZoom ] = useState(14)
  const [ initialLoad, setInitialLoad ] = useState(true)

  const [ pixelsInLng, pixelsInLat ] = farmerData.pixelsData.dimensions
  const [ lng1, lat1, lng2, lat2 ] = farmerData.pixelsData.boundingBox

  const [ pixelLatStart, pixelLatEnd ] = sortBy([ lat1, lat2 ])
  const [ pixelLngStart, pixelLngEnd ] = sortBy([ lng1, lng2 ])

  const pixelLatStep = (pixelLatEnd - pixelLatStart) / pixelsInLat
  const pixelLngStep = (pixelLngEnd - pixelLngStart) / pixelsInLng

  const handleSelectedParameterChange = (event: any) => {
    setSelectedParameter(event.target.value)
  }

  const getCenter = () => {
    if(selectedPlotId) {
      const feature = farmerData.plotsGeoJSON.features.find((f: any) => f.properties.plotId === selectedPlotId)
      const c = center(feature).geometry!.coordinates
      return {
        lat: c[1],
        lng: c[0]
      }
    }
    if(selectedPixel) {
      return {
        lat: pixelLatStart + selectedPixel[0] * pixelLatStep,
        lng: pixelLngStart + selectedPixel[1] * pixelLngStep
      }
    }

    if (initialLoad) {
      const result = CoordinateCalculator.calculateBounds(farmerData.plotsGeoJSON);
      setInitialLoad(false);
      return {
        lat: result.lat.avg,
        lng: result.lng.avg
      }
    }

    return null;
  }

  const [ mapCenter, setMapCenter ] = useState(getCenter())

  useEffect(() => {
    const mapCenter = getCenter()
    setMapCenter(mapCenter as any)
  }, [ selectedPlotId, selectedPixel ])

  const [ deficitDataUrl ] = useState(createPixelMap(farmerData.pixelsData, date))

  const pixelLats = [ ...range(pixelLatStart, pixelLatEnd, pixelLatStep), pixelLatEnd ]
  const pixelLngs = [ ...range(pixelLngStart, pixelLngEnd, pixelLngStep), pixelLngEnd ]

  const gridGeoJSON = featureCollection([
    ...pixelLats.map(lat =>
      lineString([ [ pixelLngStart, lat ], [ pixelLngEnd, lat ] ])
    ),
    ...pixelLngs.map(lng =>
      lineString([ [ lng, pixelLatStart ], [ lng, pixelLatEnd ] ])
    )
  ])

  let pixelPolygon = undefined
  if(selectedPixel) {
    const [ latIndex, lngIndex ] = selectedPixel
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

  const ParameterSelectItems = () => {
    const menuItems: any = []

    for (let i = 0; i < parameters.length; i++) {
      const parameter = parameters[i]
      console.log(parameter)
      
      menuItems.push(<MenuItem key={parameter.slug} value={parameter.slug}>{parameter.label}</MenuItem>)
    }

    return menuItems
  }

  return (
    <>
      <Map
        center={mapCenter as any}
        zoom={zoom}
        onzoomend={(e: any) => setZoom(e.target.getZoom())}
        className={css`
          height: 100%;
          .leaflet-interactive:hover {
            fill-opacity: 0.2 !important;
          }
          .leaflet-control-zoom {
            border-radius: 17px;
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
          url={deficitDataUrl}
          bounds={[ [ lat1, lng1 ], [ lat2, lng2 ] ]}
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
      <Box
        className={css`
          position: absolute !important;
          z-index: 1000;
          top: 10px;
          right: 100px;
          background-color: #fff !important;
        `}
      >
        <FormControl>
          <Select
            value={selectedParameter}
            onChange={handleSelectedParameterChange}
          >
            {
              parameters.map(( parameter: any ) => 
                <MenuItem key={parameter.slug} value={parameter.slug}>{parameter.label}</MenuItem>
              )
            }
          </Select>
        </FormControl>
        <Fab
          onClick={() => setPixelSelection(!pixelSelection)}
          size="medium"
        >
          {pixelSelection ? <GridOff/> : <Grid/>}
        </Fab>
      </Box>
    </>
  )
}

export default MapView