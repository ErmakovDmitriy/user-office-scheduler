import { Type } from 'class-transformer';
import {
  Field,
  ID,
  ObjectType,
  FieldResolver,
  Resolver,
  Root,
  Ctx,
  Arg,
  Int,
} from 'type-graphql';

import { ResolverContext } from '../../context';
import { EquipmentAssignmentStatus } from '../../models/Equipment';
import {
  ScheduledEvent as ScheduledEventBase,
  ScheduledEventBookingType,
} from '../../models/ScheduledEvent';
import { TzLessDateTime } from '../CustomScalars';
import { Equipment, EquipmentWithAssignmentStatus } from './Equipment';
import { Instrument } from './Instrument';
import { ProposalBooking } from './ProposalBooking';
import { User } from './User';

@ObjectType()
export class ScheduledEvent implements Partial<ScheduledEventBase> {
  @Field(() => ID)
  id: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => ScheduledEventBookingType)
  bookingType: ScheduledEventBookingType;

  @Field(() => TzLessDateTime)
  startsAt: Date;

  @Field(() => TzLessDateTime)
  endsAt: Date;

  @Field(() => Int, { nullable: true })
  proposalBookingId: number | null;

  // external type
  @Type(() => User)
  @Field({ nullable: true })
  scheduledBy?: User;

  @Field(() => String, { nullable: true })
  description?: string | null;

  // external type
  @Type(() => Instrument)
  @Field({ nullable: true })
  instrument?: Instrument;
}

@Resolver(() => ScheduledEvent)
export class ScheduledEventResolver {
  @FieldResolver(() => [EquipmentWithAssignmentStatus])
  equipments(
    @Root() scheduledEvent: ScheduledEvent,
    @Ctx() ctx: ResolverContext
  ): Promise<Array<Equipment & { status: EquipmentAssignmentStatus }>> {
    return ctx.queries.equipment.scheduledEventEquipments(
      ctx,
      scheduledEvent.id
    );
  }

  @FieldResolver(() => EquipmentAssignmentStatus, { nullable: true })
  equipmentAssignmentStatus(
    @Root() scheduledEvent: ScheduledEvent,
    @Ctx() ctx: ResolverContext,
    @Arg('equipmentId', () => ID) equipmentId: number
  ): Promise<EquipmentAssignmentStatus | null> {
    return ctx.queries.equipment.equipmentAssignmentStatus(
      ctx,
      scheduledEvent.id,
      equipmentId
    );
  }

  @FieldResolver(() => ProposalBooking, { nullable: true })
  async proposalBooking(
    @Root() scheduledEvent: ScheduledEvent,
    @Ctx() ctx: ResolverContext
  ): Promise<ProposalBooking | null> {
    if (scheduledEvent.proposalBookingId === null) {
      return null;
    }

    return ctx.queries.proposalBooking.get(
      ctx,
      scheduledEvent.proposalBookingId
    );
  }
}
