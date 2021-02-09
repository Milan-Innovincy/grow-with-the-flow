import React from 'react'
import { css } from '@emotion/css'
import { DateTime } from 'luxon'

import DateView from './components/DateView'
import PlotListDialog from './PlotListDialog'

type Props = {
  farmerData: any
  date: Date
}

const OverallSummary = ({ farmerData, date }: Props) => {
  
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
        />
      </div>
    </div>
  )
}

export default OverallSummary