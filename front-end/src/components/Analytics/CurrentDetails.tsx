import React from 'react'
import { css } from '@emotion/css'

import DateView from '../DateView'

type Props = {
  date: string,
  farmerData: any
}

type state = {
  currentData: any
}

export default class CurrentDetails extends React.Component<Props, state> {
  componentDidMount() {
    console.log('componentDidMount');
    
    // const { pixelsData, plotsAnalytics, plotFeedback } = farmerData
    // const current = data!.find(i => i.date === DateTime.fromJSDate(date).toFormat('dd/MM/yyyy'))
  }

  componentDidUpdate() {
    console.log('componentDidUpdate');
  }

  
  render() {
    const { date, farmerData } = this.props
    // console.log(farmerData)

    return (
      <div
          className={css`
            display: flex;
            align-items: flex-start;
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
            {/* <small
              className={css`
                font-weight: lighter;
                margin-left: 50px;
              `}
            >{label}</small> */}
            <DateView date={date} />
          </div>
          {/* <CurrentDataItem
              label="Regenval in mm"
              value={currentRainfall}
              color="#80A1D4"
              icon={<RainfallIcon fill="#80A1D4" className={css`width: 20px; height: 20px;`}/>}
          />
          <CurrentDataItem
              label="Evapotranspiratie in mm"
              value={currentEvapotranspiration}
              color="#6A7152"
              icon={<CarDefrostRear fill="#6A7152" className={css`width: 18px !important; height: 18px !important; transform: rotate(180deg);`} />}
          />
          <CurrentDataItem
              label="Vochttekort in mm"
              value={currentDeficit}
              color="#F6511D"
              icon={<Vanish fill="#F6511D" width={20} className={css`width: 18px !important; height: 18px !important;`}/>}
          />
          <CurrentDataItem
              label="Te beregenen in mm"
              value={currentSprinkling}
              color="#1565c0"
              icon={<IrrigationIcon fill="#1565c0" className={css`width: 20px; height: 20px;`}/>}
          />
          <SelectedSumData
            circleContent={getCropTypeIcon(cropType)}
            label="Gewas"
            text={cropType}
          />
          <SelectedSumData
            circleContent={Math.round(area)}
            label="Hectare"
            text={soilType}
          /> */}
          {/* <PlotListDialog
            farmerData={farmerData}
            date={DateTime.fromJSDate(date).toISODate()}
            navigate={navigate}
          /> */}
        </div>
    )
  }
}