import { ResolverContext } from '../context';
import { ScheduledEventDataSource } from '../datasources/ScheduledEventDataSource';
import Authorized from '../decorators/Authorized';
import { instrumentScientistHasInstrument } from '../helpers/instrumentHelpers';
import {
  instrumentScientistHasAccess,
  userHacAccess,
} from '../helpers/permissionHelpers';
import { ScheduledEvent } from '../models/ScheduledEvent';
import { ScheduledEventFilter } from '../resolvers/queries/ScheduledEventQuery';
import { ProposalBookingScheduledEventFilter } from '../resolvers/types/ProposalBooking';
import { Roles } from '../types/shared';

export default class ScheduledEventQueries {
  constructor(private scheduledEventDataSource: ScheduledEventDataSource) {}

  @Authorized([Roles.USER_OFFICER, Roles.INSTRUMENT_SCIENTIST])
  async scheduledEvent(
    ctx: ResolverContext,
    id: number
  ): Promise<ScheduledEvent | null> {
    return this.scheduledEventDataSource.get(id);
  }

  @Authorized([Roles.USER_OFFICER, Roles.INSTRUMENT_SCIENTIST])
  async scheduledEvents(
    ctx: ResolverContext,
    filter: ScheduledEventFilter
  ): Promise<ScheduledEvent[]> {
    if (!filter.instrumentIds?.length) {
      return [];
    }

    const results = await Promise.all(
      filter.instrumentIds.map(
        async (instrumentId) =>
          await instrumentScientistHasInstrument(ctx, instrumentId)
      )
    );

    const newInstrumentIdsByRole = filter.instrumentIds.filter(
      (_item, index) => results[index]
    );

    return this.scheduledEventDataSource.getAll({
      ...filter,
      instrumentIds: newInstrumentIdsByRole,
    });
  }

  @Authorized([Roles.USER_OFFICER, Roles.INSTRUMENT_SCIENTIST, Roles.USER])
  async proposalBookingScheduledEvents(
    ctx: ResolverContext,
    proposalBookingId: number,
    filter?: ProposalBookingScheduledEventFilter
  ): Promise<ScheduledEvent[]> {
    if (
      !(await instrumentScientistHasAccess(ctx, proposalBookingId)) &&
      !(await userHacAccess(ctx, proposalBookingId))
    ) {
      return [];
    }

    return this.scheduledEventDataSource.proposalBookingScheduledEvents(
      proposalBookingId,
      filter
    );
  }

  @Authorized([Roles.USER_OFFICER, Roles.INSTRUMENT_SCIENTIST])
  async proposalBookingScheduledEvent(
    ctx: ResolverContext,
    proposalBookingId: number,
    scheduledEventId: number
  ): Promise<ScheduledEvent | null> {
    if (!(await instrumentScientistHasAccess(ctx, proposalBookingId))) {
      return null;
    }

    return this.scheduledEventDataSource.proposalBookingScheduledEvent(
      proposalBookingId,
      scheduledEventId
    );
  }

  @Authorized([Roles.USER_OFFICER, Roles.INSTRUMENT_SCIENTIST]) // TODO: make sure we use the right permissions
  async equipmentScheduledEvents(
    ctx: ResolverContext,
    equipmentIds: number[],
    startsAt: Date,
    endsAt: Date
  ) {
    return this.scheduledEventDataSource.equipmentScheduledEvents(
      equipmentIds,
      startsAt,
      endsAt
    );
  }
}
