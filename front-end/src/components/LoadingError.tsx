import React from 'react'
import 'date-fns'
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'
import { DateTime } from 'luxon'
import MomentUtils from '@date-io/moment'
import moment from 'moment'
import 'moment/locale/nl'

type Props = {
  date: any
}

export default class LoadingError extends React.Component<Props, {}> {
  handleDateChange = (newDate: any) => {
    window.location = `${window.location.origin}/map/${DateTime.fromJSDate(newDate).toISODate()}`
  }

  render() {
    const { date } = this.props

    return (
      <div>
        <h2>Excuses, daar ging iets fout...</h2>
        <p>We kunnen geen data vinden voor deze datum.</p>

        <MuiPickersUtilsProvider libInstance={moment} utils={MomentUtils} locale={"nl"} >
          <KeyboardDatePicker
            margin="normal"
            id="date-picker-dialog"
            disableFuture={true}
            label="Kies hier een andere datum"
            format="yyyy-MM-dd"
            value={date}
            onChange={this.handleDateChange}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
          />
        </MuiPickersUtilsProvider>
      </div>
    )
  }
}