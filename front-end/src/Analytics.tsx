import React, { ReactNode, useEffect, useState } from "react";
import { css } from "@emotion/css";
import "date-fns";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelProps,
  RectangleProps,
  Line,
} from "recharts";
import {
  Paper,
  Fab,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Input,
  Button,
} from "@material-ui/core";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { Close, Vanish, CarDefrostRear } from "mdi-material-ui";
import { DateTime, Duration } from "luxon";
import produce from "immer";
import { padStart } from "lodash";
import EventEmitter from "./lib/EventEmitter";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import "moment/locale/nl";

import axiosInstance from "./lib/axios";

import UpdateSprinklingDialog from "./UpdateSprinklingDialog";
import DateView from "./DateView";
import { ReactComponent as AlfalfaIcon } from "./icons/alfalfa.svg";
import { ReactComponent as CornIcon } from "./icons/corn.svg";
import { ReactComponent as GenericIcon } from "./icons/generic.svg";
import { ReactComponent as PotatoIcon } from "./icons/potato.svg";
import { ReactComponent as WheatIcon } from "./icons/wheat.svg";
import { ReactComponent as RainfallIcon } from "./icons/rainfall.svg";
import { ReactComponent as IrrigationIcon } from "./icons/irrigation.svg";
import PlotListDialog from "./PlotListDialog";
import { FarmerData } from "./MapAndAnalytics";

const cropTypes = ["mais", "aardappelen", "gras"];
const cropStatusOptions: CropStatus = {
  mais: [
    { label: "Geen Activiteit", value: 0 },
    { label: "Opkomst", value: 0.01 },
    { label: "Vijfde blad", value: 0.4 },
    { label: "Derde bladkop", value: 0.65 },
    { label: "Pluimvorming", value: 0.9 },
    { label: "Bloei", value: 1 },
    { label: "Volledige afrijping", value: 2 },
  ],
  aardappelen: [
    { label: "Geen Activiteit", value: 0 },
    { label: "Opkomst", value: 0.01 },
    { label: "Aanzet knolontwikkeling", value: 1.0 },
    { label: "Gewasbedekking volledig", value: 1.2 },
    { label: "Afsterven", value: 2.0 },
  ],
  gras: [
    { label: "Geen activiteit", value: 0 },
    { label: "Bemaaien", value: 2 },
  ],
};

const getCropType = (cropType: string) => {
  if (cropType.startsWith("Grasland")) {
    return "gras";
  }
  if (
    cropType.startsWith("Mais") ||
    cropType.startsWith("Maïs") ||
    cropType.startsWith("MaÃ¯s")
  ) {
    return "mais";
  }
  if (cropType.startsWith("Aardappelen")) {
    return "aardappelen";
  }
  return "";
};

const getCropTypeIcon = (cropType: string) => {
  switch (cropType && cropType.trim()) {
    case "Snijmais":
    case "Mais CCM":
      return <CornIcon width={28} fill="#00acc1" />;
    case "Cons. en industrieaardappelen.":
      return <PotatoIcon width={28} stroke="#00acc1" />;
    case "Luzerne.":
      return <AlfalfaIcon width={28} fill="#00acc1" />;
    case "Winter Tarwe":
      return <WheatIcon width={28} fill="#00acc1" />;
    default:
      return <GenericIcon width={28} fill="#00acc1" />;
  }
};

const formatCropStatus = (
  cropStatuses: any,
  currentPlotId: string,
  cropType: string,
  date: string
) => {
  if (!cropStatuses || !cropStatuses.length) {
    return;
  }

  const selectedPlot = cropStatuses.find((plot: any) => {
    return plot.plotId === currentPlotId;
  });

  if (!selectedPlot) {
    return;
  }

  if (!cropType) {
    return;
  }

  const splitDate = date.split("/");
  const formattedDate = `${splitDate[2]}-${splitDate[1]}-${splitDate[0]}`;
  const selectedPlotStatus = selectedPlot.statuses.find((plotStatus: any) => {
    return plotStatus.date === formattedDate;
  });

  if (!selectedPlotStatus) {
    return;
  }

  return cropStatusOptions[cropType].find(
    (cropStatusValue: CropStatusValue) => {
      return (
        cropStatusValue.value === parseFloat(selectedPlotStatus["crop-status"])
      );
    }
  );
};

const developmentStateToLabel = (
  developmentState: number,
  cropType: string
) => {
  if (!cropType) {
    return;
  }
  if (!cropStatusOptions[cropType]) {
    return;
  }

  const nextStageIndex = cropStatusOptions[cropType].findIndex(
    (cropStatusValue: CropStatusValue) => {
      return developmentState < cropStatusValue.value;
    }
  );
  return cropStatusOptions[cropType][nextStageIndex - 1];
};

let updateSprinklingDialog: UpdateSprinklingDialog;

const SelectedSumData = ({
  circleContent,
  label,
  text,
}: {
  circleContent: ReactNode;
  label: string;
  text: string;
}) => (
  <div
    className={css`
      display: flex;
      align-items: center;
      text-transform: uppercase;
      margin-left: 40px;
    `}
  >
    <div
      className={css`
        border: 1px solid #d2eded;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
      `}
    >
      {circleContent}
    </div>
    <div
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <small
        className={css`
          color: #bcbcbc;
        `}
      >
        {label}
      </small>
      <strong>{text}</strong>
    </div>
  </div>
);

const LegendItem = ({
  label,
  shape,
  color,
}: {
  label: string;
  shape: "square" | "circle";
  color: string;
}) => (
  <div
    className={css`
      display: flex;
      align-items: center;
      margin-right: 20px;
    `}
  >
    {shape === "square" && (
      <div
        className={css`
          width: 14px;
          height: 14px;
          margin-right: 5px;
          border-radius: 3px;
          background-color: ${color};
        `}
      />
    )}
    {shape === "circle" && (
      <div
        className={css`
          width: 10px;
          height: 10px;
          margin-right: 5px;
          border-radius: 50%;
          border: 2px solid ${color};
        `}
      />
    )}
    <small
      className={css`
        color: #757575;
      `}
    >
      {label}
    </small>
  </div>
);

const CurrentDataItem = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) => (
  <div
    className={css`
      display: flex;
      align-items: center;
      margin-right: 20px;
    `}
  >
    <div
      className={css`
        position: relative;
        border: 1px solid ${color};
        color: ${color};
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
      `}
    >
      <div
        className={css`
          position: relative;
          z-index: 1;
        `}
      >
        {Math.round(value)}
      </div>
      <div
        className={css`
          position: absolute;
          top: 0;
          left: 0;
          background-color: #fff;
          border-radius: 50%;
          padding: 0 2px 2px 0px;
        `}
      >
        {icon}
      </div>
    </div>
    <div
      className={css`
        color: ${color};
      `}
    >
      {label}
    </div>
  </div>
);

type Props = {
  navigate: (path: string) => void;
  farmerData: FarmerData;
  date: Date;
  selectedPlotId?: string;
  selectedPixel?: Array<number>;
};

type CropStatus = {
  [key: string]: CropStatusValue[];
};

type CropStatusValue = {
  label: string;
  value: number;
};

type AnalyticsData = {
  date: string;
  rainfall: number;
  sprinkling: number;
  moisture: number;
  desiredMoisture: number;
  evapotranspiration: number;
  deficit: number;
  developmentStage: number;
};

const Analytics: React.FC<Props> = ({
  navigate,
  farmerData,
  date,
  selectedPlotId,
  selectedPixel,
}) => {
  const [cropStatus, setCropStatus] = useState<CropStatusValue>();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [label, setLabel] = useState<string>("");
  const [cropType, setCropType] = useState<string>("");
  const [soilType, setSoilType] = useState<string>("");
  const [area, setArea] = useState<number>(0);

  useEffect(() => {
    const { pixelsData, plotsAnalytics, plotFeedback, plotCropStatus } =
      farmerData;

    if (selectedPlotId) {
      setLabel(`Plot ${selectedPlotId}`);
      const [sprinklingData] = plotFeedback.filter(
        (feedback: any) => feedback.plotId === selectedPlotId
      );
      const feature = farmerData.plotsGeoJSON.features.find(
        (f: any) => f.properties!.plotId === selectedPlotId
      );

      setCropType(getCropType(feature.properties.cropTypes));
      setSoilType(feature.properties.soilType);
      setArea(feature.properties.plotSizeHa);
      setCropStatus(
        formatCropStatus(
          plotCropStatus,
          selectedPlotId,
          getCropType(feature.properties.cropTypes),
          DateTime.fromJSDate(date).toFormat("dd/MM/yyyy")
        )
      );

      if (!!plotsAnalytics[feature.properties.plotId]) {
        setAnalyticsData(
          plotsAnalytics[feature.properties.plotId].map((i: any) => {
            const quantityForDate = sprinklingData
              ? sprinklingData.quantities.find((q: any) => q.date === i.date)
              : null;
            const sprinkling = quantityForDate ? quantityForDate.quantityMM : 0;
            return {
              date: DateTime.fromISO(i.date).toFormat("dd/MM/yyyy"),
              rainfall: i.measuredPrecipitation,
              sprinkling,
              moisture: i.availableSoilWater,
              desiredMoisture: i.relativeTranspiration * 10,
              evapotranspiration: i.evapotranspiration,
              deficit: i.deficit,
              developmentStage: i.developmentStage,
            };
          })
        );
      } else {
        alert("No data available for this plot.");
        navigate(`/map/${DateTime.fromJSDate(date).toISODate()}`);
      }
    }

    if (selectedPixel) {
      const [x, y] = selectedPixel;
      setLabel(
        `Pixel ${padStart(x.toString(), 3, "0")}${padStart(
          y.toString(),
          3,
          "0"
        )}`
      );
      setCropType(getCropType(pixelsData.landUse[x][y]));
      setSoilType(pixelsData.soilMap[x][y]);
      setArea(1);
      setAnalyticsData(
        pixelsData.analytics.map((i: any, index: number) => ({
          date: DateTime.fromISO(i.time).toFormat("dd/MM/yyyy"),
          isForecast: i.isForecast,
          rainfall: i.measuredPrecipitation[x][y],
          sprinkling: 0,
          moisture: i.availableSoilWater[x][y],
          desiredMoisture: i.relativeTranspiration[x][y] * 10,
          evapotranspiration: i.evapotranspiration[x][y],
          deficit: i.deficit[x][y],
          developmentStage: i.developmentStage,
        }))
      );
    }
  }, [selectedPlotId, selectedPixel, farmerData, farmerData.plotCropStatus]);
  const currentAnalyticsData = analyticsData.find(
    (i) => i.date === DateTime.fromJSDate(date).toFormat("dd/MM/yyyy")
  );

  setTimeout(() => {
    const nodes = document.querySelectorAll(
      ".recharts-layer.recharts-cartesian-axis-tick"
    );
    nodes.forEach((node) => {
      const textNode = node.querySelector("tspan");
      const rawDate = textNode ? textNode.innerHTML : null;

      if (rawDate && rawDate.indexOf("/") !== -1) {
        const formattedDate = new Date(
          DateTime.fromFormat(rawDate, "dd/MM/yyyy").toFormat("yyyy-MM-dd")
        );
        const predictionDate = new Date(
          DateTime.fromJSDate(new Date())
            .minus(Duration.fromObject({ days: 1 }))
            .toFormat("yyyy-MM-dd")
        );

        if (textNode) {
          if (new Date().toDateString() === formattedDate.toDateString()) {
            textNode.style.fontWeight = "900";
            textNode.style.fontSize = "12px";
          }

          if (formattedDate >= predictionDate) {
            textNode.style.fontStyle = "italic";
          }
        }
      }
    });
  }, 750);

  const handleDateViewClick = () => {
    document
      .querySelector(
        ".MuiFormControl-root.MuiTextField-root.MuiFormControl-marginNormal button"
      )
      .click();
  };

  const changeCropStatus = (event: any) => {
    setCropStatus(event.target.value);
    const formattedDate = DateTime.fromJSDate(new Date(date)).toFormat(
      "yyyy-MM-dd"
    );

    axiosInstance
      .put(
        `/plot-feedback/crop-status?plotId=${selectedPlotId}&date=${formattedDate}&crop-status=${event.target.value.toString()}`
      )
      .then(() => {
        EventEmitter.emit("sprinkling-updated-success");
      })
      .catch((error: Error) => {
        EventEmitter.emit("sprinkling-updated-failure");
        console.error(error);
      });
  };

  const handleDateChange = (newDate: any) => {
    if (selectedPlotId) {
      navigate(
        `/map/${DateTime.fromMillis(
          moment(newDate).valueOf()
        ).toISODate()}/plot/${selectedPlotId}`
      );
    }

    if (selectedPixel) {
      navigate(
        `/map/${DateTime.fromMillis(
          moment(newDate).valueOf()
        ).toISODate()}/pixel/${selectedPixel.join("-")}`
      );
    }
  };

  return (
    <Paper
      elevation={5}
      className={css`
        position: relative;
        z-index: 1000;
      `}
      square
    >
      <Fab
        onClick={() => {
          navigate(`/map/${DateTime.fromJSDate(date).toISODate()}`);
          window.dispatchEvent(new Event("resize"));
        }}
        size="medium"
        className={css`
          position: absolute !important;
          right: 24px;
          top: -24px;
          background-color: #fff !important;
          color: #2f3d50 !important;
          box-shadow: 0px 3px 5px -1px #2f3d50, 0px -1px 10px 0px #2f3d50,
            0px 1px 18px 0px #2f3d50 !important;
        `}
      >
        <Close />
      </Fab>
      <div
        className={css`
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          height: 60px;
          padding: 30px 20px 0 20px;
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: row;
            color: #2f3d50;
          `}
        >
          <div>
            <small
              className={css`
                font-weight: lighter;
                margin-left: 50px;
              `}
            >
              {label}
            </small>
            <div
              onClick={handleDateViewClick}
              className={css`
                cursor: pointer;
              `}
            >
              <DateView date={date} />
            </div>
            <MuiPickersUtilsProvider
              libInstance={moment}
              utils={MomentUtils}
              locale={"nl"}
            >
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
                  "aria-label": "change date",
                }}
              />
            </MuiPickersUtilsProvider>
          </div>
        </div>
        {currentAnalyticsData && (
          <div
            className={css`
              display: flex;
            `}
          >
            <CurrentDataItem
              label="Regenval in mm"
              value={currentAnalyticsData.rainfall}
              color="#80A1D4"
              icon={
                <RainfallIcon
                  fill="#80A1D4"
                  className={css`
                    width: 20px;
                    height: 20px;
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Verdamping in mm"
              value={currentAnalyticsData.evapotranspiration}
              color="#6A7152"
              icon={
                <CarDefrostRear
                  fill="#6A7152"
                  className={css`
                    width: 18px !important;
                    height: 18px !important;
                    transform: rotate(180deg);
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Beschikbaar bodemvocht in mm"
              value={currentAnalyticsData.moisture}
              color="#f6511d"
              icon={
                <Vanish
                  fill="#f6511d"
                  width={20}
                  className={css`
                    width: 18px !important;
                    height: 18px !important;
                  `}
                />
              }
            />
            <CurrentDataItem
              label="Te beregenen in mm"
              value={currentAnalyticsData.sprinkling}
              color="#1565c0"
              icon={
                <IrrigationIcon
                  fill="#1565c0"
                  className={css`
                    width: 20px;
                    height: 20px;
                  `}
                />
              }
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
            />
            <PlotListDialog
              farmerData={farmerData}
              date={DateTime.fromJSDate(date).toISODate()}
              navigate={navigate}
            />
          </div>
        )}
      </div>
      <div
        className={css`
          background-color: #fcfcfc;
          padding-top: 10px;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
          `}
        ></div>
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
          `}
        >
          <div
            className={css`
              display: flex;
            `}
          >
            <LegendItem label="Regenval in mm" shape="square" color="#64b5f6" />
            <LegendItem
              label="Beregening in mm"
              shape="square"
              color="#1565c0"
            />
            <LegendItem
              label="Beschikbaar bodemvocht in mm"
              shape="circle"
              color="#f6511d"
            />
            <LegendItem
              label="Waterstressfactor"
              shape="circle"
              color="#00acc1"
            />
          </div>
          <div
            className={css`
              display: flex;
            `}
          >
            <FormControl
              className={css`
                margin-right: 10px !important;
              `}
              disabled={!selectedPlotId}
            >
              <InputLabel htmlFor="component-simple">
                Actuele gewasstatus
              </InputLabel>
              <Select
                className={css`
                  min-width: 200px;
                `}
                value={
                  cropStatus && cropStatus.value
                    ? cropStatus.value.toString()
                    : ""
                }
                onChange={changeCropStatus}
                disabled={cropTypes.every((type) => cropType !== type)}
              >
                {Object.keys(cropStatusOptions).map((key: string) =>
                  key === cropType
                    ? cropStatusOptions[key].map((object: CropStatusValue) => (
                        <MenuItem
                          key={object.value}
                          value={object.value.toString()}
                        >
                          {object.label} ({object.value})
                        </MenuItem>
                      ))
                    : null
                )}
              </Select>
            </FormControl>
            <FormControl
              className={css`
                margin-left: 30px !important;
              `}
              disabled={!selectedPlotId}
            >
              <InputLabel id="crop-status-label">
                Berekend gewasstatus
              </InputLabel>
              <Input
                id="component-simple"
                value={
                  currentAnalyticsData &&
                  developmentStateToLabel(
                    currentAnalyticsData.developmentStage,
                    cropType
                  )
                    ? `${
                        developmentStateToLabel(
                          currentAnalyticsData.developmentStage,
                          cropType
                        ).label
                      } ${currentAnalyticsData.developmentStage.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
                    : ""
                }
                readOnly
              />
            </FormControl>
          </div>
        </div>
        <ResponsiveContainer height={200}>
          <ComposedChart
            data={analyticsData}
            margin={{ top: 20, bottom: 0, left: 0, right: 0 }}
          >
            <defs>
              <linearGradient id="moistureColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffe0b2" stopOpacity={0} />
              </linearGradient>
              <radialGradient
                id="radial"
                fx="50%"
                fy="50%"
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor="#1e88e5" stopOpacity="1" />
                <stop offset="100%" stopColor="#1e88e5" stopOpacity="0" />
              </radialGradient>
              <clipPath id="bar-rounded-corners">
                <rect x="0" y="0" width="100" height="100" rx="5" ry="5" />
              </clipPath>
            </defs>
            <CartesianGrid />
            <XAxis
              dataKey="date"
              xAxisId={0}
              axisLine={{ stroke: "#f6511d" }}
              tickLine={false}
              tick={{ fill: "#757575", fontSize: 10 }}
            />
            <XAxis dataKey="date" xAxisId={1} hide />
            <XAxis dataKey="date" xAxisId={2} hide />
            <YAxis
              yAxisId="left"
              padding={{ bottom: 50, top: 0 }}
              axisLine={{ stroke: "#1e88e5" }}
              tickLine={false}
              tick={{ fill: "#1e88e5", fontSize: 10 }}
              width={30}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={{ stroke: "#f6511d" }}
              tickLine={false}
              tick={{ fill: "#f6511d", fontSize: 10 }}
              width={30}
            />
            <Area
              dataKey="moisture"
              xAxisId={2}
              yAxisId="right"
              type="natural"
              stroke="#f6511d"
              fill="url(#moistureColor)"
            />
            <Line
              dataKey="desiredMoisture"
              xAxisId={2}
              yAxisId="left"
              type="natural"
              stroke="#00acc1"
            />
            <Bar
              dataKey="rainfall"
              xAxisId={0}
              yAxisId="left"
              barSize={60}
              shape={({ x, y, width, height }: RectangleProps) =>
                height! < 10 ? null : (
                  <path
                    {...{ x, y, width, height }}
                    fill="#64b5f6"
                    opacity={0.8}
                    d={`m${x},${y! + height!} v-${
                      height! - 10
                    } a10,10 270 0 1 10 -10 h${
                      width! - 20
                    } a10,10 0 0 1 10 10 v${height! - 10} z`}
                  />
                )
              }
            />
            <Bar
              dataKey="sprinkling"
              isAnimationActive={false}
              xAxisId={1}
              yAxisId="left"
              fill="#1565c0"
              opacity={0.8}
              barSize={40}
              label={({
                value,
                x,
                y,
                width,
                index,
              }: LabelProps & { index: number }) => (
                <g
                  onClick={async () => {
                    await updateSprinklingDialog.open(
                      value as number,
                      analyticsData ? analyticsData[index] : ""
                    );
                  }}
                >
                  <circle
                    cx={x! + width! / 2}
                    cy={y!}
                    r={width! / 2 + 8}
                    fill="url(#radial)"
                  />
                  <circle
                    cx={x! + width! / 2}
                    cy={y!}
                    r={width! / 2 + 3}
                    fill="#ffffff"
                    stroke="#64b5f6"
                  />
                  <circle
                    cx={x! + width! / 2}
                    cy={y!}
                    r={width! / 2}
                    fill="#ffffff"
                    stroke="#1565c0"
                    strokeWidth={2}
                  />
                  <text
                    x={x! + width! / 2}
                    y={y!}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#1565c0"
                    fontSize={10}
                  >
                    {value} mm
                  </text>
                </g>
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <UpdateSprinklingDialog
        selectedPlotId={selectedPlotId}
        farmerData={farmerData}
        ref={(d) => (updateSprinklingDialog = d!)}
      />
    </Paper>
  );
};

export default Analytics;
