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
  Link,
  IconButton,
  Input,
} from "@material-ui/core";
import blue from "@material-ui/core/colors/blue";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CancelIcon from "@material-ui/icons/Cancel";

import { ApplicationContext } from "./ApplicationContext";
import { FarmerData } from "./MapAndAnalytics";

type Props = {
  farmerData: FarmerData;
  date: string;
  navigate: (path: string) => void;
};

type ColumnNames =
  | "availableSoilWater"
  | "deficit"
  | "relativeTranspiration"
  | "evapotranspiration"
  | "sprinkling";

const PlotListDialog = ({ farmerData, date, navigate }: Props) => {
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
        return {};
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

  return (
    <ApplicationContext.Consumer>
      {({ showModal, toggleShowModal }) => (
        <Dialog open={showModal} onClose={toggleShowModal} fullScreen>
          <DialogContent>
            <Typography variant="h6">Perceeloverzicht {date}</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  {isManager && <TableCell>Boer</TableCell>}
                  <TableCell>Gewas</TableCell>
                  <TableCell>Perceelnaam</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "availableSoilWater"}
                      direction={order}
                      onClick={() => sortColumn("availableSoilWater")}
                    >
                      Vochtgehalte (mm)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "deficit"}
                      direction={order}
                      onClick={() => sortColumn("deficit")}
                    >
                      Watertekort (mm)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "relativeTranspiration"}
                      direction={order}
                      onClick={() => sortColumn("relativeTranspiration")}
                    >
                      Waterstressfactor (%)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "evapotranspiration"}
                      direction={order}
                      onClick={() => sortColumn("evapotranspiration")}
                    >
                      Verdamping (mm)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "sprinkling"}
                      direction={order}
                      onClick={() => sortColumn("sprinkling")}
                    >
                      Beregening (mm)
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((data) => (
                  <TableRow key={data.properties!.plotId}>
                    <TableCell>
                      <Link
                        style={{ cursor: "pointer", color: blue[500] }}
                        color={"primary"}
                        onClick={() => {
                          navigate(
                            `/map/${date}/plot/${data.properties.plotId}`
                          );
                          toggleShowModal();
                        }}
                      >
                        {data.properties.plotId}
                      </Link>
                    </TableCell>
                    {isManager && (
                      <TableCell>{data.properties.farmerName}</TableCell>
                    )}
                    <TableCell>{data.properties.cropTypes}</TableCell>
                    <TableCell>
                      <EditableRowField
                        defaultValue={"name"}
                        onSave={() => console.log("saving")}
                      />
                    </TableCell>
                    <TableCell>
                      {Math.round(data.analytics.availableSoilWater)}
                    </TableCell>
                    <TableCell>{Math.round(data.analytics.deficit)}</TableCell>
                    <TableCell>
                      {Math.round(data.analytics.relativeTranspiration * 100)}%
                    </TableCell>
                    <TableCell>
                      {Math.round(data.analytics.evapotranspiration)}
                    </TableCell>
                    <TableCell>{data.analytics.sprinkling}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={toggleShowModal}>Annuleren</Button>
          </DialogActions>
        </Dialog>
      )}
    </ApplicationContext.Consumer>
  );
};

export default PlotListDialog;

interface EditableRowFieldProps {
  defaultValue: string;
  onSave: (name: string) => any;
}
const EditableRowField: React.FC<EditableRowFieldProps> = ({
  onSave,
  defaultValue,
}) => {
  const [editState, setEditState] = useState(false);
  const [name, setName] = useState(defaultValue);

  if (!editState) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ minWidth: "150px" }}>{name}</span>
        <IconButton
          onClick={() => setEditState(true)}
          style={{ marginLeft: "12px" }}
          size="small"
        >
          <EditIcon />
        </IconButton>
      </div>
    );
  } else {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          style={{ minWidth: "150px" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <IconButton
          onClick={() => {
            onSave(name);
            setEditState(false);
          }}
          style={{ marginLeft: "12px" }}
          size="small"
        >
          <SaveIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setName(defaultValue);
            setEditState(false);
          }}
          size="small"
        >
          <CancelIcon />
        </IconButton>
      </div>
    );
  }
};
