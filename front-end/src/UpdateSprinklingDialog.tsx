import React, { Component } from 'react'
import { Button, Dialog, DialogActions, DialogContent, TextField, CircularProgress, Snackbar } from '@material-ui/core'
import { css } from '@emotion/css'
import EventEmitter from './EventEmitter'

type State = {
  open: boolean,
  loading: boolean,
  value: number,
  snackbarMessage: string,
  showSnackbar: boolean
}

type Props = {
  date: Date
  selectedPlotId: string
}

export default class UpdateSprinklingDialog extends Component<Props, State> {
  state: State = {
    open: false,
    loading: false,
    showSnackbar: false,
    value: 0,
    snackbarMessage: ''
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

  handleSnackbarClosed = () => {
    this.setState({
      showSnackbar: false,
      snackbarMessage: ''
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

  componentDidMount() {
    EventEmitter.on('sprinkling-updated-success', () => {
      this.setState({
        loading: false,
        open: false,
        value: 0,
        showSnackbar: true,
        snackbarMessage: 'Beregening is opgeslagen.'
      })
    })
    EventEmitter.on('sprinkling-updated-failure', () => {
      this.setState({ loading: true, open: false })
    })
  }

  render() {
    const { open, loading, value, showSnackbar, snackbarMessage } = this.state
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
        
        {/* TODO: This snackbar should go into global scope */}
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={showSnackbar}
          onClose={this.handleSnackbarClosed}
          message={snackbarMessage}
        />
      </Dialog>
    )
  }
}
