import React from 'react'
// import { css } from '@emotion/css'

import CloseButton from './CloseButton'
import CurrentDetails from './CurrentDetails'


type Props = {
  date: string,
  farmerData: any
}

export default class Header extends React.Component<Props, {}> {
  render() {
    const { date, farmerData } = this.props

    return (
      <div>
        <CloseButton
          date={date}
        />

        <CurrentDetails
          date={date}
          farmerData={farmerData}
        />
      </div>
    )
  }
}