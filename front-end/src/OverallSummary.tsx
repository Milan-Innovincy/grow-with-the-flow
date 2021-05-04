import React from 'react'
import 'date-fns'
import { css } from '@emotion/css'
import { DateTime } from 'luxon'
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'
// import EventEmitter from './lib/EventEmitter'
import MomentUtils from '@date-io/moment'
import moment from 'moment'
import 'moment/locale/nl'

import DateView from './DateView'
import PlotListDialog from './PlotListDialog'

type Props = {
  farmerData: any
  date: Date
  navigate: (path: string) => void
  sprinklingCache: any
}

const OverallSummary = ({ farmerData, date, navigate, sprinklingCache }: Props) => {

  const handleDateViewClick = () => {
    document.querySelector('.MuiFormControl-root.MuiTextField-root.MuiFormControl-marginNormal button').click()
  }

  const handleDateChange = (newDate: any) => {
    window.location = `${window.location.origin}/map/${DateTime.fromMillis(moment(newDate).valueOf()).toISODate()}`
  }
  
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
        <div
          onClick={handleDateViewClick}
          className={css`
            cursor: pointer;
          `}>
          <DateView date={date} />
        </div>
          <MuiPickersUtilsProvider libInstance={moment} utils={MomentUtils} locale={"nl"} >
            <KeyboardDatePicker
              className={css`
                display: none !important;
              `}
              margin="normal"
              id="date-picker-dialog"
              disableFuture={true}
              label="Date picker dialog"
              format="yyyy-MM-dd"
              value={date}
              onChange={handleDateChange}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
          </MuiPickersUtilsProvider>
      </div>
      <div>
        <PlotListDialog
          farmerData={farmerData}
          date={DateTime.fromJSDate(date).toISODate()}
          navigate={navigate}
          sprinklingCache={sprinklingCache}
        />
      </div>
    </div>
  )
}

export default OverallSummary