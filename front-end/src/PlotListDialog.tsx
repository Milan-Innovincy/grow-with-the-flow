import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  TableSortLabel,
  IconButton,
  Tooltip,
  CircularProgress
} from "@material-ui/core";

import { css } from "@emotion/css";
import { ApplicationContext } from "./ApplicationContext";
import { FarmerData } from "./MapAndAnalytics";
import DateView from "./DateView";
import SmsIcon from "@material-ui/icons/Sms";
import AddCommentIcon from '@material-ui/icons/AddComment';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import OpacityIcon from '@material-ui/icons/Opacity';
import EcoIcon from '@material-ui/icons/Eco';
import EditIcon from '@material-ui/icons/Edit';
import { DateTime } from "luxon";
import UpdateNameDialog from "./UpdatePlotNameDialog";
import UpdateDescriptionDialog from "./UpdatePlotDescriptionDialog";
import Snackbar from "./Snackbar";

type Props = {
  farmerData: FarmerData;
  date: string;
  navigate: (path: string) => void;
  selectedPlotId: string | undefined;
  selectedPixel: number[] | undefined;
  isFetchingData: boolean;
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
  | "name";

const PlotListDialog = ({ farmerData, date, navigate, selectedPlotId, selectedPixel, isFetchingData }: Props) => {
  const contextValue = useContext(ApplicationContext);
  const isManager =
    contextValue.keycloak.tokenParsed.user_type === "WATERBOARD_MANAGER";
  const [tableData, setTableData] = useState<any[]>([]);
  const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<ColumnNames | undefined>(undefined);

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

  const handleDateViewClick = () => {
    document
      .querySelector(
        ".MuiFormControl-root.MuiTextField-root.MuiFormControl-marginNormal button"
      )
      .click();
  };

  const handleDatePrevClicked = () => {
    let newDate = DateTime.fromISO(date).minus({days: 1}).toISODate();

    if (selectedPlotId) {
      navigate(
        `/map/${newDate}/plot/${selectedPlotId}`
      );
    }

    if (selectedPixel) {
      navigate(
        `/map/${newDate}/pixel/${selectedPixel.join("-")}`
      );
    }

    if (!selectedPlotId && !selectedPixel){
      navigate(
        `/map/${newDate}`
      );
    }
  }

  const handleDateNextClicked = () => {
    let newDate = DateTime.fromISO(date).plus({days: 1}).toISODate();

    if (selectedPlotId) {
      navigate(
        `/map/${newDate}/plot/${selectedPlotId}`
      );
    }

    if (selectedPixel) {
      navigate(
        `/map/${newDate}/pixel/${selectedPixel.join("-")}`
      );
    }

    if (!selectedPlotId && !selectedPixel){
      navigate(
        `/map/${newDate}`
      );
    }
  }


  useEffect(() => {
    const data = farmerData.plotsGeoJSON.features.map((feature) => {
      let sprinkling = 0;
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
          },
        };
      } else {
        return {
          properties: feature.properties,
          analytics: {
            sprinkling: sprinkling,
          },
        };
      }
    });
    if (orderBy && order) {
      setTableData([
        ...data.sort((a, b) => {
          if (order === "asc") {
            return a.analytics[orderBy] - b.analytics[orderBy];
          } else {
            return b.analytics[orderBy] - a.analytics[orderBy];
          }
        }),
      ]);
    } else {
      setTableData(data);
    }
  }, [farmerData.plotsGeoJSON.features, orderBy, order]);

  let updateNameDialog: UpdateNameDialog;
  let updateDescriptionDialog: UpdateDescriptionDialog;

  return (
    <ApplicationContext.Consumer>
      {({ showModal, toggleShowModal }) => (
        <Dialog open={showModal} onClose={toggleShowModal} fullScreen>
          <DialogActions
            className={css`
              background: #2f3d50;
              color: #ffffff;
            `}
          >
            <Button 
              className={css`
                padding: 6px 0 !important;
                min-width: 34px !important;
              `}
              variant={'contained'} 
              onClick={handleDatePrevClicked}
            >
              <ArrowBackIcon/>
            </Button>
            <div
              onClick={handleDateViewClick}
              className={css`
                cursor: pointer;
                transform: translateY(24px);
                margin-right: 10px;
                display: inline-block;
              `}
            >
              <DateView date={new Date(date)} />
            </div>
            <Button 
              className={css`
                padding: 6px 0 !important;
                min-width: 34px !important;
              `}
              variant={'contained'} 
              onClick={handleDateNextClicked} 
              disabled={date === DateTime.fromJSDate(new Date()).toISODate()}
            >
              <ArrowForwardIcon/>
            </Button>
            <Typography style={{display: "inline-block", textAlign: "center", flexGrow: 1}} variant="h6">Perceeloverzicht</Typography>
            <Button variant={'contained'} onClick={toggleShowModal} startIcon={<ArrowBackIcon/>}>Terug</Button>
          </DialogActions>
          <DialogContent className={css`padding: 8px 0 !important; position: relative;`}>
            <Table className={css`
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
                background-color: #f3f5f5
              }
            `}>
              <TableHead>
                <TableRow>
                  {/* <TableCell>ID</TableCell> */}
                  {isManager && <TableCell>Boer</TableCell>}
                  <TableCell>Gewas</TableCell>
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
                      onClick={() => sortColumn("relativeTranspiration")}
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
                    {" "}
                    <TableSortLabel
                      active={orderBy === "sprinkling"}
                      direction={order}
                      onClick={() => sortColumn("sprinkling")}
                    >
                      Beregening (mm)
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
                  <TableCell>
                    Laatst Gewijzigd
                  </TableCell>
                  <TableCell>
                    Commentaar
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((data) => (
                  <TableRow
                    key={data.properties && data.properties!.plotId}
                    onClick={() => {
                      navigate(`/map/${date}/plot/${data.properties.plotId}`);
                      toggleShowModal();
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
                    <TableCell className={'edit-cell'}>
                      {data.properties && `${data.properties.name || ""}`}
                      <IconButton
                        size="small"
                        className={'edit-icon'} 
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateNameDialog.open(
                            data.properties && data.properties.name ? data.properties.name as string : "",
                            data.properties && data.properties.plotId && data.properties.plotId as string
                          );
                        }}
                      >
                        <EditIcon/>
                      </IconButton>
                      
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.availableSoilWater &&
                        `${Math.round(data.analytics.availableSoilWater)}`}
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.deficit && 
                      `${Math.round(data.analytics.deficit)}`}
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.relativeTranspiration &&
                        `${Math.round(data.analytics.relativeTranspiration * 100)}`}
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.evapotranspiration &&
                        `${Math.round(data.analytics.evapotranspiration)}`}
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.sprinkling &&
                      `${data.analytics.sprinkling}`}
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.relativeHumidity &&
                      `${Math.round(data.analytics.relativeHumidity)}`}
                    </TableCell>
                    <TableCell align="center">
                      {data.properties && data.analytics.averageTemperature &&
                      `${Math.round(data.analytics.averageTemperature)}`}
                    </TableCell>
                    <TableCell style={{whiteSpace: 'nowrap'}}>
                      <Tooltip title={"Beregening: 5mm"}>
                        <div>
                          <OpacityIcon className={css`
                            color: #1565c0;     
                            font-size: 14px !important;
                            transform: translateY(2px)
                          `}/>{"2021-08-08"}
                        </div>
                      </Tooltip>
                      <Tooltip title={"Gewasstatus: Geen ontwikkeling (0.0)"}>
                        <div>
                          <EcoIcon  className={css`
                            color: #489c33;
                            font-size: 14px !important;
                            transform: translateY(2px)
                          `}/>{"2021-08-08"}
                          </div>
                          </Tooltip>
                    </TableCell>
                    <TableCell align={'center'}>
                      <IconButton
                        className={css`position: relative;`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateDescriptionDialog.open(
                            data.properties && data.properties.description ? data.properties.description : "",
                            data.properties && data.properties.plotId && data.properties.plotId as string
                          );
                        }}
                      >
                        { data.properties && data.properties.description && data.properties.description !== "" ?
                          <SmsIcon 
                          className={css`
                            color: #b2d6d4;
                          `}
                          />
                          :
                          <AddCommentIcon 
                            className={css`
                              color: #e2e2e2;
                              transform: rotateY(180deg);
                            `}
                          />
                        }
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isFetchingData && 
              <div
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                background: #ffffff99;
                z-index: 9000;
                height: 100%;
                width: 100%;
                padding: 24px 0;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <CircularProgress />
            </div>
            }
          </DialogContent>
          <UpdateNameDialog
            ref={(d) => (updateNameDialog = d!)}
          />
          <UpdateDescriptionDialog
            ref={(d) => (updateDescriptionDialog = d!)}
          />
          <Snackbar />
        </Dialog>
      )}
    </ApplicationContext.Consumer>
  );
};

export default PlotListDialog;

