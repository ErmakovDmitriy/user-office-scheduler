import MomentUtils from '@date-io/moment';
import { MTableToolbar, Options } from '@material-table/core';
import {
  CircularProgress,
  Grid,
  makeStyles,
  TextField,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import moment, { Moment } from 'moment';
import React, { Dispatch, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';

import { InstrumentAndEquipmentContext } from 'context/InstrumentAndEquipmentContext';
import { Equipment, ScheduledEventFilter } from 'generated/sdk';
import { useQuery } from 'hooks/common/useQuery';
import { PartialInstrument } from 'hooks/instrument/useUserInstruments';
import { toTzLessDateTime } from 'utils/date';

import { CalendarScheduledEvent } from './Event';

const useStyles = makeStyles((theme) => ({
  tooltip: {
    margin: theme.spacing(0, 0, 2, 0),
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarViewSelect: {
    minWidth: 120,
  },
}));

type TableViewToolbarProps = {
  onDateRangeChange: (startDate: Moment | null, endDate: Moment | null) => void;
  startsAtDate: string;
  endsAtDate: string;
};

function TableViewToolbar({
  onDateRangeChange,
  startsAtDate,
  endsAtDate,
}: TableViewToolbarProps) {
  const { instruments, loadingInstruments, equipments, loadingEquipments } =
    useContext(InstrumentAndEquipmentContext);
  const query = useQuery();
  const classes = useStyles();
  const history = useHistory();
  const queryStartsAt = query.get('startsAt');
  const queryEndsAt = query.get('endsAt');

  const [startsAt, setStartsAt] = useState<Moment | null>(
    moment(queryStartsAt || startsAtDate)
  );
  const [endsAt, setEndsAt] = useState<Moment | null>(
    moment(queryEndsAt || endsAtDate)
  );
  const [queryEquipment, setQueryEquipment] = useState<number[]>([]);

  const queryInstrument = query.get('instrument');

  useEffect(() => {
    setQueryEquipment(
      query
        .get('equipment')
        ?.split(',')
        .map((num) => parseInt(num)) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // NOTE: If the initial start/end date is different than current start/end date then we should call onDateRangeChange
    if (
      moment(startsAtDate).diff(startsAt, 'hour') ||
      moment(endsAtDate).diff(endsAt, 'hour')
    ) {
      onDateRangeChange(startsAt, endsAt);
      query.set('startsAt', `${startsAt}`);
      query.set('endsAt', `${endsAt}`);

      history.push(`?${query}`);
    }
  }, [
    startsAt,
    startsAtDate,
    endsAt,
    endsAtDate,
    onDateRangeChange,
    history,
    query,
  ]);

  const [queryValueInitialized, setQueryValueInitialized] = useState(
    !queryInstrument // if the link has query instrument query value when rendering this component
  );

  const [selectedInstrument, setSelectedInstrument] =
    useState<PartialInstrument | null>(null);

  const [selectedEquipment, setSelectedEquipment] = useState<
    Pick<Equipment, 'id' | 'name'>[] | undefined
  >([]);

  useEffect(() => {
    if (
      selectedEquipment?.length === 0 &&
      queryEquipment.length !== 0 &&
      equipments
    ) {
      setSelectedEquipment(
        equipments.filter((eq) => queryEquipment.includes(eq.id))
      );
    }
  }, [equipments, queryEquipment, selectedEquipment]);

  useEffect(() => {
    if (queryInstrument) {
      const found = instruments.find(({ id }) => `${id}` === queryInstrument);

      found && setSelectedInstrument(found);
      setQueryValueInitialized(true);
    }
  }, [instruments, queryInstrument, setSelectedInstrument]);

  useEffect(() => {
    if (
      loadingInstruments ||
      !queryValueInitialized ||
      (!selectedInstrument && !queryInstrument)
    ) {
      return;
    }

    if (!selectedInstrument && queryInstrument) {
      query.delete('instrument');
    } else if (
      selectedInstrument &&
      queryInstrument !== `${selectedInstrument.id}`
    ) {
      query.set('instrument', `${selectedInstrument.id}`);
    } else {
      return;
    }

    history.push(`?${query}`);
  }, [
    queryValueInitialized,
    loadingInstruments,
    selectedInstrument,
    queryInstrument,
    query,
    history,
  ]);

  const onInstrumentSelect = (selectedInstrument: PartialInstrument | null) => {
    setSelectedInstrument(selectedInstrument);
  };

  return (
    <div className={classes.tooltip}>
      <Grid container spacing={2}>
        <Grid item sm={6} xs={12}>
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <KeyboardDatePicker
              required
              label="From date"
              name={`startsAt`}
              margin="dense"
              format={'yyyy-MM-DD'}
              fullWidth
              data-cy="table-toolbar-startsAt"
              value={startsAt}
              onChange={(newValue) => setStartsAt(newValue)}
            />
            <KeyboardDatePicker
              required
              label="To date"
              name={`endsAt`}
              margin="dense"
              format={'yyyy-MM-DD'}
              fullWidth
              data-cy="table-toolbar-endsAt"
              value={endsAt}
              onChange={(newValue) => setEndsAt(newValue)}
            />
          </MuiPickersUtilsProvider>
        </Grid>
        <Grid item sm={6} xs={12}>
          <Autocomplete
            loading={loadingInstruments}
            disabled={loadingInstruments}
            selectOnFocus
            fullWidth
            clearOnBlur
            handleHomeEndKeys
            options={instruments}
            getOptionLabel={(instrument) => instrument.name}
            data-cy="table-toolbar-instrument-select"
            id="table-toolbar-instrument-select"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Instrument"
                disabled={loadingInstruments}
                margin="dense"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingInstruments ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            value={selectedInstrument}
            onChange={(
              event: React.ChangeEvent<unknown>,
              newValue: PartialInstrument | null
            ) => {
              onInstrumentSelect(newValue);
            }}
          />
          <Autocomplete
            multiple
            loading={loadingEquipments}
            disabled={loadingEquipments}
            selectOnFocus
            clearOnBlur
            fullWidth
            handleHomeEndKeys
            options={equipments}
            getOptionLabel={(equipment) => equipment.name}
            data-cy="table-toolbar-equipment-select"
            id="table-toolbar-equipment-select"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Equipment"
                margin="dense"
                disabled={loadingEquipments}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingEquipments ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            value={selectedEquipment}
            onChange={(
              event: React.ChangeEvent<unknown>,
              newValue: Pick<Equipment, 'id' | 'name'>[] | undefined
            ) => {
              if (newValue === undefined || newValue.length === 0) {
                query.delete('equipment');
              } else {
                query.set(
                  'equipment',
                  `${newValue?.map((eq) => eq.id).join(',')}`
                );
              }
              setSelectedEquipment(newValue);
              history.push(`?${query}`);
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

const TableToolbar = (
  data: Options<CalendarScheduledEvent>,
  filter: ScheduledEventFilter,
  setFilter: Dispatch<ScheduledEventFilter>
): JSX.Element => {
  const onDateRangeChange = (
    startDate: Moment | null,
    endDate: Moment | null
  ) => {
    if (startDate && endDate) {
      setFilter({
        ...filter,
        startsAt: toTzLessDateTime(startDate),
        endsAt: toTzLessDateTime(endDate),
      });
    }
  };

  return (
    <>
      <TableViewToolbar
        onDateRangeChange={onDateRangeChange}
        startsAtDate={filter.startsAt}
        endsAtDate={filter.endsAt}
      />
      <MTableToolbar {...data} />
    </>
  );
};

export default TableToolbar;
