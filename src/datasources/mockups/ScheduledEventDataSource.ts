/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ScheduledEvent,
  ScheduledEventBookingType,
} from '../../models/ScheduledEvent';
import { NewScheduledEventInput } from '../../resolvers/mutations/CreateScheduledEventMutation';
import { ScheduledEventFilter } from '../../resolvers/queries/ScheduledEventsQuery';
import { ScheduledEventDataSource } from '../ScheduledEventDataSource';

export const dummyScheduledEvents: ScheduledEvent[] = [
  new ScheduledEvent(
    123,
    new Date(),
    new Date(),
    ScheduledEventBookingType.COMMISSIONING,
    new Date(),
    new Date(),
    { id: 0 },
    null
  ),
  new ScheduledEvent(
    321,
    new Date(),
    new Date(),
    ScheduledEventBookingType.SHUTDOWN,
    new Date(),
    new Date(),
    { id: 0 },
    'dummy'
  ),
];

export default class MockupScheduledEventDataSource
  implements ScheduledEventDataSource {
  async create(
    newScheduledEvent: NewScheduledEventInput
  ): Promise<ScheduledEvent> {
    return new ScheduledEvent(
      100,
      new Date(),
      new Date(),
      newScheduledEvent.bookingType,
      newScheduledEvent.startsAt,
      newScheduledEvent.endsAt,
      { id: newScheduledEvent.scheduledById },
      newScheduledEvent.description
    );
  }

  async delete(): Promise<null> {
    throw new Error('Method not implemented.');
  }

  async scheduledEvent(id: number): Promise<ScheduledEvent | null> {
    return dummyScheduledEvents.find(se => se.id === id) ?? null;
  }

  async scheduledEvents(
    filter?: ScheduledEventFilter
  ): Promise<ScheduledEvent[]> {
    return dummyScheduledEvents;
  }
}
