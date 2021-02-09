import React from 'react'
import { css } from '@emotion/css'
import { Fab } from '@material-ui/core'
import { Close } from 'mdi-material-ui'

import EventEmitter from '../../lib/EventEmitter'

type Props = {
  date: string,
}
  
export default class Header extends React.Component<Props, {}> {
  render() {
    const { date } = this.props

    return (
      <Fab
        onClick={() => {
          const path = `/map/${date}`
          EventEmitter.emit('navigate', path)
          window.dispatchEvent(new Event('resize'))
        }}
        size="medium"
        className={css`
          position: absolute !important;
          right: 24px;
          top: -24px;
          background-color: #fff !important;
          color: #2F3D50 !important;
          box-shadow: 0px 3px 5px -1px #2F3D50, 0px -1px 10px 0px #2F3D50, 0px 1px 18px 0px #2F3D50 !important;
        `}
      >
        <Close />
      </Fab>
    )
  }
}