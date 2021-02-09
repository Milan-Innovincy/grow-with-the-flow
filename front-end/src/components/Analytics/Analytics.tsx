import React from 'react'
import { css } from '@emotion/css'
import { Paper } from '@material-ui/core'
// import { Close, Vanish, CarDefrostRear } from 'mdi-material-ui'

// import EventEmitter from '../../EventEmitter'
import Header from './Header'

type Props = {
//   farmerData: any
  date: string,
//   navigate: (path: string) => void
}

export default class Analytics extends React.Component<Props, {}> {
  render() {
    const { date } = this.props

    return(
      <Paper
        elevation={5}
        className={css`
          position: relative;
          z-index: 1000;
        `}
        square
      >
        <Header
          date={date}
        />
      </Paper>
    )
  }
}