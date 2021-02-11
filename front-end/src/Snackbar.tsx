import React from 'react'
import { Snackbar as MaterialSnackbar } from '@material-ui/core'
import EventEmitter from './lib/EventEmitter'

type State = {
  snackbarMessage: string,
  showSnackbar: boolean,
  anchorOrigin: {
    vertical: "bottom" | "top",
    horizontal: "left" | "right" | "center"
  }
}

export default class Snackbar extends React.Component<{}, State> {
  state: State = {
    showSnackbar: false,
    snackbarMessage: '',
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
  }

  handleShowSnackbar = ({ snackbarMessage }: { snackbarMessage: string }) => {
    this.setState({
      showSnackbar: true,
      snackbarMessage,
    })
  }

  handleOnClose = () => {
    this.setState({
      showSnackbar: false,
      snackbarMessage: ''
    })
  }

  componentDidMount() {
    EventEmitter.on('show-snackbar', this.handleShowSnackbar)
  }

  render() {
    const { anchorOrigin, showSnackbar, snackbarMessage } = this.state
    
    return(
      <MaterialSnackbar
        autoHideDuration={3000}
        anchorOrigin={anchorOrigin}
        open={showSnackbar}
        onClose={this.handleOnClose}
        message={snackbarMessage}
      />
    )
  }
}