import React from 'react'

import CloseButton from './CloseButton'

type Props = {
  date: string,
}
  
export default class Header extends React.Component<Props, {}> {
  render() {
    const { date } = this.props

    return (
      <CloseButton
        date={date}
      />
    )
  }
}