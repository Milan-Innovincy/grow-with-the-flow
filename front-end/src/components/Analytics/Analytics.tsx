import React from 'react'
import { css } from '@emotion/css'
import { Paper } from '@material-ui/core'
// import { Close, Vanish, CarDefrostRear } from 'mdi-material-ui'

// import EventEmitter from '../../EventEmitter'
import Header from './Header'

type Props = {
  date: string,
  // farmerData: any,
  // selectedPlotId?: string
  // selectedPixel?: Array<number>
}

export default class Analytics extends React.Component<Props, {}> {
  render() {
    const { date } = this.props
    // const { date, farmerData, selectedPlotId, selectedPixel } = this.props
    // console.log(selectedPlotId)
    console.log('render analytics')

    return(
      <Paper
        elevation={5}
        className={css`
          position: relative;
          z-index: 1000;
        `}
        square
      >
        {/* <Header
          date={date}
          farmerData={farmerData}
          selectedPlotId={selectedPlotId}
          selectedPixel={selectedPixel}
        /> */}
      </Paper>
    )
  }
}