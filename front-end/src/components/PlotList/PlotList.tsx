import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  IconButton,
  Tooltip,
  Paper,
  ButtonBase,
} from "@material-ui/core";
import { AutoSizer } from "react-virtualized/dist/commonjs/AutoSizer";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import { css } from "@emotion/css";
import SmsIcon from "@material-ui/icons/Sms";
import AddCommentIcon from "@material-ui/icons/AddComment";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import OpacityIcon from "@material-ui/icons/Opacity";
import EcoIcon from "@material-ui/icons/Eco";
import EditIcon from "@material-ui/icons/Edit";

import UpdateNameDialog from "../../UpdatePlotNameDialog";
import UpdateDescriptionDialog from "../../UpdatePlotDescriptionDialog";
import { ApplicationContext } from "../../ApplicationContext";
import { FarmerData } from "../../MapAndAnalytics";
import { getCropType, developmentStateToLabel } from "../../Analytics";

type Props = {
  farmerData: FarmerData;
  date: string;
  navigate: (path: string) => void;
  selectedPlotId: string | undefined;
  selectedPixel: number[] | undefined;
  isFetchingData: boolean;
  truncated: boolean;
  setTruncated?: Dispatch<SetStateAction<boolean>>;
};

type ColumnNames =
  | "availableSoilWater"
  | "deficit"
  | "relativeTranspiration"
  | "evapotranspiration"
  | "sprinkling"
  | "relativeHumidity"
  | "temperature"
  | "lastUpdated"
  | "name"
  | "farmerName"
  | "cropTypes";

const PlotList = ({
  farmerData,
  date,
  navigate,
  selectedPlotId,
  selectedPixel,
  isFetchingData,
  truncated,
  setTruncated,
}: Props) => {
  const contextValue = useContext(ApplicationContext);
  const isManager =
    contextValue.keycloak.tokenParsed.user_type === "WATERBOARD_MANAGER";
  const [tableData, setTableData] = useState<any[]>([]);
  const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<ColumnNames | undefined>(undefined);
  const tableRows: HTMLTableRowElement[] = [];

  const sortColumn = (column: ColumnNames) => {
    if (orderBy !== column) {
      setOrderBy(column);
      setOrder("desc");
    } else if (order === "desc" && orderBy === column) {
      setOrder("asc");
    } else if (order === "asc" && orderBy === column) {
      setOrder(undefined);
      setOrderBy(undefined);
    }
  };

  // const handleDateViewClick = () => {
  //   document
  //     .querySelector(
  //       ".MuiFormControl-root.MuiTextField-root.MuiFormControl-marginNormal button"
  //     )
  //     .click();
  // };

  // const handleDatePrevClicked = () => {
  //   let newDate = DateTime.fromISO(date).minus({ days: 1 }).toISODate();

  //   if (selectedPlotId) {
  //     navigate(`/map/${newDate}/plot/${selectedPlotId}`);
  //   }

  //   if (selectedPixel) {
  //     navigate(`/map/${newDate}/pixel/${selectedPixel.join("-")}`);
  //   }

  //   if (!selectedPlotId && !selectedPixel) {
  //     navigate(`/map/${newDate}`);
  //   }
  // };

  // const handleDateNextClicked = () => {
  //   let newDate = DateTime.fromISO(date).plus({ days: 1 }).toISODate();

  //   if (selectedPlotId) {
  //     navigate(`/map/${newDate}/plot/${selectedPlotId}`);
  //   }

  //   if (selectedPixel) {
  //     navigate(`/map/${newDate}/pixel/${selectedPixel.join("-")}`);
  //   }

  //   if (!selectedPlotId && !selectedPixel) {
  //     navigate(`/map/${newDate}`);
  //   }
  // };

  useEffect(() => {
    const data = farmerData.plotsGeoJSON.features.map((feature) => {
      /**
       * Get last updated values
       */
      let lastUpdated: any = {
        plotFeedback: undefined,
        plotCropStatus: undefined,
      };

      if (
        feature.properties.plotId &&
        farmerData.plotsAnalytics[feature.properties.plotId]
      ) {
        //Sort values by date so ensure we take most recent
        let quantity = farmerData.plotFeedback.find(
          (feedback) => feedback.plotId === feature.properties.plotId
        );

        if (quantity && quantity!.quantities.length > 0) {
          lastUpdated.plotFeedback = quantity.quantities.sort((a, b) => {
            return b.date.localeCompare(a.date);
          })![0];
        }

        let status = farmerData.plotCropStatus.find(
          (feedback) => feedback.plotId === feature.properties.plotId
        );

        if (status && status.statuses!.length > 0) {
          lastUpdated.plotCropStatus = status.statuses.sort((a, b) => {
            return b.date.localeCompare(a.date);
          })![0];
        }
      }

      let sprinkling = undefined;
      /**
       * Get sprinkling data
       */
      if (
        feature.properties.plotId &&
        farmerData.plotsAnalytics[feature.properties.plotId]
      ) {
        const analyticsIndex = farmerData.plotsAnalytics[
          feature.properties.plotId
        ].findIndex((a: any) => a.date === date);

        sprinkling =
          farmerData.plotFeedback.find(
            (feedback) => feedback.plotId === feature.properties.plotId
          ) &&
          farmerData.plotFeedback
            .find((feedback) => feedback.plotId === feature.properties.plotId)
            .quantities.find((quantity) => quantity.date === date)
            ? farmerData.plotFeedback
                .find(
                  (feedback) => feedback.plotId === feature.properties.plotId
                )
                .quantities.find((quantity) => quantity.date === date)
                .quantityMM
            : 0;
        return {
          properties: feature.properties,
          analytics: {
            ...farmerData.plotsAnalytics[feature.properties.plotId][
              analyticsIndex
            ],
            sprinkling: sprinkling,
            lastUpdated: lastUpdated,
          },
        };
      } else {
        return {
          properties: feature.properties,
          analytics: {
            sprinkling: sprinkling,
            lastUpdated: lastUpdated,
          },
        };
      }
    });
    if (orderBy && order) {
      setTableData([
        ...data.sort((a, b) => {
          /**
           * Order strings for farmerName, name, cropType
           */
          if (
            orderBy === "farmerName" ||
            orderBy === "name" ||
            orderBy === "cropTypes"
          ) {
            if (order === "desc") {
              if (a.analytics.hasOwnProperty(orderBy) && a.analytics[orderBy]) {
                return a.analytics[orderBy].localeCompare(b.analytics[orderBy]);
              } else if (
                a.properties.hasOwnProperty(orderBy) &&
                a.properties[orderBy]
              ) {
                return a.properties[orderBy].localeCompare(
                  b.properties[orderBy]
                );
              }
            } else {
              if (b.analytics.hasOwnProperty(orderBy) && b.analytics[orderBy]) {
                return b.analytics[orderBy].localeCompare(a.analytics[orderBy]);
              }
              if (
                b.properties.hasOwnProperty(orderBy) &&
                b.properties[orderBy]
              ) {
                return b.properties[orderBy].localeCompare(
                  a.properties[orderBy]
                );
              }
            }
          } else {
            /**
             * Order number values
             */
            if (order === "asc") {
              return a.analytics[orderBy] - b.analytics[orderBy];
            } else {
              return b.analytics[orderBy] - a.analytics[orderBy];
            }
          }
        }),
      ]);
    } else {
      setTableData(data);
    }
  }, [farmerData.plotsGeoJSON.features, orderBy, order]);

  useEffect(() => {
    if (selectedPlotId) {
      const selectedTablePlot = tableRows.find(
        (row) => row.id === selectedPlotId
      );
      if (selectedTablePlot) {
        selectedTablePlot.scrollIntoView({ behavior: "smooth", block:"center"});
      }
    }
  }, [selectedPlotId, tableRows]);

  let updateNameDialog: UpdateNameDialog;
  let updateDescriptionDialog: UpdateDescriptionDialog;

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
      `}
    >
      <ButtonBase
        onClick={() => {
          if (setTruncated !== undefined) {
            setTruncated(!truncated);
          }
        }}
      >
        <Paper
          className={css`
            height: 100%;
            display: flex;
            align-items: center;
          `}
          elevation={3}
          square
        >
          {truncated ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
        </Paper>
      </ButtonBase>
      <div
        className={css`
          height: 100%;
          width: 100%;
        `}
      >
        <AutoSizer>
          {({ height, width }) => {
            return (
              <div
                className={css`
                  height: ${height}px;
                  width: ${width}px;
                  overflow: auto;
                `}
              >
                <Table
                  size="small"
                  stickyHeader
                  className={css`
                    .edit-icon {
                      position: absolute;
                      top: 50%;
                      display: none;
                      color: #b2d6d4;
                      transform: translateY(-50%);
                    }

                    .edit-cell {
                      position: relative;
                    }

                    .edit-cell:hover .edit-icon {
                      display: inline;
                    }

                    tbody tr:hover {
                      background-color: #f3f5f5;
                    }
                  `}
                >
                  <TableHead
                    className={css`
                      top: 0;
                      z-index: 2;
                    `}
                  >
                    <TableRow>
                      {/* <TableCell>ID</TableCell> */}
                      {isManager && (
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === "farmerName"}
                            direction={order}
                            onClick={() => sortColumn("farmerName")}
                          >
                            Boer
                          </TableSortLabel>
                        </TableCell>
                      )}
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "cropTypes"}
                          direction={order}
                          onClick={() => sortColumn("cropTypes")}
                        >
                          Gewas
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === "name"}
                          direction={order}
                          onClick={() => sortColumn("name")}
                        >
                          Perceel Naam
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={orderBy === "availableSoilWater"}
                          direction={order}
                          onClick={() => sortColumn("availableSoilWater")}
                        >
                          Vochtgehalte (mm)
                        </TableSortLabel>
                      </TableCell>
                      {!truncated && (
                        <>
                          <TableCell align="center">
                            <TableSortLabel
                              active={orderBy === "deficit"}
                              direction={order}
                              onClick={() => sortColumn("deficit")}
                            >
                              Watertekort (mm)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={orderBy === "relativeTranspiration"}
                              direction={order}
                              onClick={() =>
                                sortColumn("relativeTranspiration")
                              }
                            >
                              Droogtestress (%)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            {" "}
                            <TableSortLabel
                              active={orderBy === "evapotranspiration"}
                              direction={order}
                              onClick={() => sortColumn("evapotranspiration")}
                            >
                              Verdamping (mm)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={orderBy === "relativeHumidity"}
                              direction={order}
                              onClick={() => sortColumn("relativeHumidity")}
                            >
                              Luchtvochtigheid (%)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={orderBy === "temperature"}
                              direction={order}
                              onClick={() => sortColumn("temperature")}
                            >
                              Temperatuur (°C)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={orderBy === "sprinkling"}
                              direction={order}
                              onClick={() => sortColumn("sprinkling")}
                            >
                              Beregening (mm)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Laatst Gewijzigd</TableCell>
                          <TableCell>Commentaar</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.map((data) => (
                      <TableRow
                        key={data.properties && data.properties!.plotId}
                        id={data.properties!.plotId}
                        ref={(ref) => {
                          if (ref) {
                            tableRows.push(ref);
                          }
                        }}
                        onClick={() => {
                          navigate(
                            `/map/${date}/plot/${data.properties.plotId}`
                          );
                        }}
                        className={css`
                          cursor: pointer;
                        `}
                      >
                        {/* <TableCell>
                      {data.properties && `${data.properties.plotId}`}
                    </TableCell> */}
                        {isManager && (
                          <TableCell>
                            {data.properties && `${data.properties.farmerName}`}
                          </TableCell>
                        )}
                        <TableCell>
                          {data.properties && `${data.properties.cropTypes}`}
                        </TableCell>
                        <TableCell className={"edit-cell"}>
                          {data.properties && `${data.properties.name || ""}`}
                          <IconButton
                            size="small"
                            className={"edit-icon"}
                            onClick={async (e) => {
                              if (e) {
                                e.stopPropagation();
                              }
                              await updateNameDialog.open(
                                data.properties && data.properties.name
                                  ? (data.properties.name as string)
                                  : "",
                                data.properties &&
                                  data.properties.plotId &&
                                  (data.properties.plotId as string)
                              );
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell align="center">
                          {data.properties &&
                            data.analytics.availableSoilWater &&
                            `${Math.round(data.analytics.availableSoilWater)}`}
                        </TableCell>
                        {!truncated && (
                          <>
                            <TableCell align="center">
                              {data.properties &&
                                data.analytics.deficit &&
                                `${Math.round(data.analytics.deficit)}`}
                            </TableCell>
                            <TableCell
                              align="center"
                              className={css`
                                ${Math.round(
                                  data.analytics.relativeTranspiration * 100
                                ) >= 50 &&
                                `
                                  position: relative;
                                  ::before {
                                    content: '';
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    height: 40px;
                                    width: 40px;
                                    transform: translate(-50%, -50%);
                                    border: 2px solid #ff817b;
                                    max-height: 100%;
                                    border-radius: 100%;
                                  }
                                `}
                              `}
                            >
                              {data.properties &&
                                data.analytics.relativeTranspiration &&
                                `${Math.round(
                                  data.analytics.relativeTranspiration * 100
                                )}`}
                            </TableCell>
                            <TableCell align="center">
                              {data.properties &&
                                data.analytics.evapotranspiration &&
                                `${Math.round(
                                  data.analytics.evapotranspiration
                                )}`}
                            </TableCell>
                            <TableCell align="center">
                              {data.properties &&
                                data.analytics.relativeHumidity &&
                                `${Math.round(
                                  data.analytics.relativeHumidity
                                )}`}
                            </TableCell>
                            <TableCell align="center">
                              {data.properties &&
                                data.analytics.averageTemperature &&
                                `${Math.round(
                                  data.analytics.averageTemperature
                                )}`}
                            </TableCell>
                            <TableCell align="center">
                              {data.properties &&
                                data.analytics.sprinkling &&
                                `${data.analytics.sprinkling}`}
                            </TableCell>
                            <TableCell style={{ whiteSpace: "nowrap" }}>
                              {data.analytics.lastUpdated.plotFeedback && (
                                <Tooltip
                                  title={`Beregening: ${data.analytics.lastUpdated.plotFeedback.quantityMM}mm`}
                                >
                                  <div>
                                    <OpacityIcon
                                      className={css`
                                        color: #1565c0;
                                        font-size: 14px !important;
                                        transform: translateY(2px);
                                      `}
                                    />
                                    {
                                      data.analytics.lastUpdated.plotFeedback
                                        .date
                                    }
                                  </div>
                                </Tooltip>
                              )}
                              {data.analytics.lastUpdated.plotCropStatus && (
                                <Tooltip
                                  title={`Gewasstatus: ${
                                    developmentStateToLabel(
                                      data.analytics.lastUpdated.plotCropStatus[
                                        "crop-status"
                                      ],
                                      getCropType(data.properties.cropTypes)
                                    ) &&
                                    developmentStateToLabel(
                                      data.analytics.lastUpdated.plotCropStatus[
                                        "crop-status"
                                      ],
                                      getCropType(data.properties.cropTypes)
                                    )!.label
                                  } (${
                                    data.analytics.lastUpdated.plotCropStatus[
                                      "crop-status"
                                    ]
                                  })`}
                                >
                                  <div>
                                    <EcoIcon
                                      className={css`
                                        color: #489c33;
                                        font-size: 14px !important;
                                        transform: translateY(2px);
                                      `}
                                    />
                                    {
                                      data.analytics.lastUpdated.plotCropStatus
                                        .date
                                    }
                                  </div>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell align={"center"}>
                              <IconButton
                                className={css`
                                  position: relative;
                                `}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await updateDescriptionDialog.open(
                                    data.properties &&
                                      data.properties.description
                                      ? data.properties.description
                                      : "",
                                    data.properties &&
                                      data.properties.plotId &&
                                      (data.properties.plotId as string)
                                  );
                                }}
                              >
                                {data.properties &&
                                data.properties.description &&
                                data.properties.description !== "" ? (
                                  <SmsIcon
                                    className={css`
                                      color: #b2d6d4;
                                    `}
                                  />
                                ) : (
                                  <AddCommentIcon
                                    className={css`
                                      color: #e2e2e2;
                                      transform: rotateY(180deg);
                                    `}
                                  />
                                )}
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <UpdateNameDialog ref={(d) => (updateNameDialog = d!)} />
                <UpdateDescriptionDialog
                  ref={(d) => (updateDescriptionDialog = d!)}
                />
              </div>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

export default PlotList;
