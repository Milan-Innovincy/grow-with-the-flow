import React from 'react'
// import { css } from '@emotion/css'

import CloseButton from './CloseButton'
import CurrentDetails from './CurrentDetails'

function Close(props: any) {
  const { date, selectedPlotId, selectedPixel } = props
  
  if (selectedPlotId || selectedPixel) {
    return (
      <CloseButton
        date={date}
      />
    )
  } else {
    return null
  }
}

type Props = {
  date: string,
  farmerData: any,
  selectedPlotId?: string
  selectedPixel?: Array<number>
}

export default class Header extends React.Component<Props, {}> {
  render() {
    const { date, farmerData, selectedPlotId, selectedPixel } = this.props

    return (
      <div>
        <Close
          date={date}
          selectedPlotId={selectedPlotId}
          selectedPixel={selectedPixel}
        />

        <CurrentDetails
          date={date}
          farmerData={farmerData}
        />
      </div>
    )
  }
}