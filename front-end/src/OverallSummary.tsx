import React from 'react'
import { css } from '@emotion/css'
import { DateTime } from 'luxon'

import DateView from './DateView'
import PlotListDialog from './PlotListDialog'

type Props = {
  farmerData: any
  date: Date
  navigate: (path: string) => void
}

const OverallSummary = ({ farmerData, date, navigate }: Props) => {
  
  return(
    <div
      className={css`
        display: flex;
        height: 60px;
        padding: 30px 20px 0 20px;
      `}
    >
      <div
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          color: #2F3D50;
        `}
      >
        <small
          className={css`
            font-weight: lighter;
            margin: 0 0 6px 50px;
          `}
        >Alle Pixels</small>
        <DateView date={date}/>
      </div>
      <div>
        <PlotListDialog
          farmerData={farmerData}
          date={DateTime.fromJSDate(date).toISODate()}
          navigate={navigate}
        />
      </div>
    </div>
  )
}

export default OverallSummary