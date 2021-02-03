import React, {useState, useEffect, useContext} from 'react'
import { RouteComponentProps, Redirect } from 'react-router-dom'
import axios from 'axios'
import { css } from '@emotion/css'
import { Paper, CircularProgress } from '@material-ui/core'
import { DateTime, Duration } from 'luxon'
import EventEmitter from './EventEmitter'

import MapView from './MapView'
import Analytics from './Analytics'
import OverallSummary from './OverallSummary'
import { ApplicationContext } from "./ApplicationContext"

import axiosInstance from "./lib/axios"

type Props = RouteComponentProps<{
  date?: string
  selectionType?: 'plot' | 'pixel'
  selectionId?: string
}>

const MapAndAnalytics = ({ match, history }: Props) => {
  const [ farmerData, setFarmerData ] = useState(null as any)
  const [ sprinklingCache, setSprinklingCache ] = useState({})
  const contextValue = useContext(ApplicationContext)

  const { date, selectionType, selectionId } = match.params
  const latestAvailableDate = DateTime.fromJSDate(new Date())
                                .minus(Duration.fromObject({ days: 2 }))
                                .toFormat('yyyy-MM-dd')

  useEffect(() => {
    (async () => {
      const isAuthenticated = contextValue.keycloak && contextValue.keycloak.token
      
      if (isAuthenticated) {
        const prefix = 'https://storage.googleapis.com/grow-with-the-flow.appspot.com'
        const dateToken = date ? date.replace(/-/g, '') : latestAvailableDate.replace(/-/g, '')
        const { data: landUse } = await axios.get(`${prefix}/gwtf-land-use.json`)
        const { data: soilMap } = await axios.get(`${prefix}/gwtf-soil-map.json`)
        const { data: pixelsData } = await axios.get(`${prefix}/gwtf-pixels-${dateToken}.json`)

        const plotsGeoJSON = await axiosInstance.get(`/plots`).then(({ data }) => {
          return data
        }).catch((error: Error) => {
          // TODO: Properly handle error
          throw new Error(error.message)
        })
        const plotsAnalytics = await axiosInstance.get(`/plot-analytics?on=${date}&attributes=deficit,measuredPrecipitation,evapotranspiration,availableSoilWater`).then(({ data }) => {
          return data
        }).catch((error: Error) => {
          // TODO: Properly handle error
          throw new Error(error.message)
        })

        pixelsData.landUse = landUse
        pixelsData.soilMap = soilMap

        // TODO: Processing features data should not happen while entire app is still blocked. Find responsible component and move logic there to handle gracefully.
        plotsGeoJSON.features = plotsGeoJSON.features.filter((feature: any) => feature.properties.plotId)        
        
        const farmerData = {
          pixelsData,
          plotsGeoJSON,
          plotsAnalytics,
          plotFeedback: []
        }

        EventEmitter.on('sprinkling-update', handleSprinklingUpdate)
        EventEmitter.on('sprinkling-updated-success', handleSprinklingUpdatedSuccess)

        setFarmerData(farmerData)
        console.log(farmerData.plotFeedback)
        getPlotFeedback(farmerData)
        
        setTimeout(() => {
          console.log(farmerData.plotFeedback)
        }, 1500)
      }
    })()
  }, [contextValue.authenticated])

  const handleSprinklingUpdate = (payload: any) => {
    const { date, selectedPlotId, value, farmerData } = payload
    const formattedDate = DateTime.fromJSDate(new Date(date)).toFormat('yyyy-MM-dd')

    axiosInstance.put(`/plot-feedback?plotId=${selectedPlotId}&date=${formattedDate}&irrigationMM=${value}`).then(({ data }) => {
      EventEmitter.emit('sprinkling-updated-success', farmerData)
    }).catch((error: Error) => {
      EventEmitter.emit('sprinkling-updated-failure')
      console.error(error)
    })
  }

  const handleSprinklingUpdatedSuccess = (payload: any) => {
    // setFarmerData(payload)
    // getPlotFeedback(payload)
  }

  const getPlotFeedback = async (farmerData: any) => {
    const { plotsAnalytics } = farmerData
    const datesInTimeRange = plotsAnalytics[Object.keys(plotsAnalytics)[0]].map((a: any) => a.date)
    const sortedDates = datesInTimeRange.sort((dateA: string, dateB: string) => {
      return Date.parse(dateA) > Date.parse(dateB)
    })
    const dateFrom = sortedDates[0]
    const dateTo = sortedDates[sortedDates.length - 1]
    await axiosInstance.get(`/plot-feedback?from=${dateFrom}&to=${dateTo}`).then(({ data }) => {
      farmerData.plotFeedback = data
      setFarmerData(farmerData)
      EventEmitter.emit('plotfeedback-updated')
    }).catch((error: Error) => {
      // TODO: Properly handle error
      throw new Error(error.message)
    })
  }

  if (!date) {
    return <Redirect to={`/map/${latestAvailableDate}`} />
  }

  if(!farmerData) {
    return(
      <div
        className={css`
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <CircularProgress/>
      </div>
    )
  }

  let selectedPlotId: string | undefined = undefined
  let selectedPixel: Array<number> | undefined = undefined

  if(selectionId) {
    switch(selectionType) {
      case 'plot':
        selectedPlotId = selectionId
        break
      case 'pixel':
        selectedPixel = selectionId.split('-').map(n => parseInt(n, 10))
        break
      default:
        return <Redirect to={`/map/${date}`}/>
    }
  }

  const navigate = (path: string) => history.push(path)

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          position: relative;
          flex: 1;
        `}
      >
        <MapView
          navigate={navigate}
          farmerData={farmerData}
          date={date}
          selectedPlotId={selectedPlotId}
          selectedPixel={selectedPixel}
        />
      </div>
      <Paper
        elevation={5}
        className={css`
          position: relative;
          z-index: 1000;
        `}
        square
      >
        {(selectedPlotId || selectedPixel) ?
          <Analytics
            date={new Date(date)}
            farmerData={farmerData}
            navigate={navigate}
            selectedPixel={selectedPixel}
            selectedPlotId={selectedPlotId}
            sprinklingCache={sprinklingCache}
            setSprinklingCache={setSprinklingCache}
          /> : <OverallSummary
            date={new Date(date)}
            farmerData={farmerData}
            navigate={navigate}
            sprinklingCache={sprinklingCache}
          />
        }
      </Paper>
    </div>
  )
}

export default MapAndAnalytics