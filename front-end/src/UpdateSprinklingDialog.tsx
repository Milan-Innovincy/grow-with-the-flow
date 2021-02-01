import React, { Component } from 'react'
import { Button, Dialog, DialogActions, DialogContent, TextField, CircularProgress } from '@material-ui/core'
import { css } from '@emotion/css'
import EventEmitter from './EventEmitter'

type State = {
  open: boolean,
  loading: boolean,
  value: number
}

type Props = {
  date: Date
  selectedPlotId: string
}

export default class UpdateSprinklingDialog extends Component<Props, State> {
  state: State = {
    open: false,
    loading: false,
    value: 0,
  }

  resolve?: (value?: number | PromiseLike<number> | undefined) => void = undefined

  open = (value: number) => {
    return new Promise<void>((resolve, reject) => {
      try {
        this.setState({
          open: true,
          value
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  handleSprinklingSubmitted = (value: number) => {
    const payload = {
      value,
      selectedPlotId: this.props.selectedPlotId,
      date: this.props.date
    }
    EventEmitter.emit('sprinkling-update', payload)
    this.setState({ loading: true })
  }

  handleSprinklingUpdatedSuccess = () => {
    this.setState({
      loading: false,
      open: false,
      value: 0
    })
    EventEmitter.emit('show-snackbar', {
      snackbarMessage: 'Waarde is opgeslagen.'
    })
  }

  handleSprinklingUpdatesFailure = () => {
    this.setState({
      loading: true,
      open: false
    })
    EventEmitter.emit('show-snackbar', {
      snackbarMessage: 'De waarde kon niet worden opgeslagen.'
    })
  }

  componentDidMount() {
    EventEmitter.on('sprinkling-updated-success', this.handleSprinklingUpdatedSuccess)
    EventEmitter.on('sprinkling-updated-failure', this.handleSprinklingUpdatesFailure)
  }

  render() {
    const { open, loading, value } = this.state
    return(
      <Dialog
        open={open}
        onClose={() => this.setState({ open: false })}
      >
        <DialogContent>
          <TextField
            type="number"
            autoFocus
            fullWidth
            label="Beregening in mm"
            value={value}
            inputProps={{
              min: 0
            }}
            onChange={e => this.setState({ value: parseInt(e.target.value, 10)})}
          />
        </DialogContent>
        <DialogActions>
          <div className={css`
            position: relative;
            pointer-events: none;
          `}>
          <Button
            color="primary"
            onClick={() => {
              this.handleSprinklingSubmitted(value)
            }}
            disabled={loading}
            className={css`
            pointer-events: auto;
          `}
          >Bijwerken</Button>
          <div className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
          `}>
            {loading && <CircularProgress size={24} />}
          </div>
          </div>
          <Button
            onClick={() => this.setState({ open: false })}
            disabled={loading}
          >Annuleren</Button>
        </DialogActions>
      </Dialog>
    )
  }
}
