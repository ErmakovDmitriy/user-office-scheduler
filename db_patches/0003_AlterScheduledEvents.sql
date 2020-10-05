DO
$DO$
BEGIN
  IF register_patch('AlterScheduledEvents.sql', 'Peter Asztalos', 'AlterScheduledEvents', '2020-09-30 11:00:00.000000+00') THEN
  BEGIN

  ALTER TABLE "scheduled_events" ADD "proposal_booking_id" int DEFAULT NULL;

  ALTER TABLE "scheduled_events" ADD CONSTRAINT scheduled_events_proposal_booking_id_fkey 
    FOREIGN KEY ("proposal_booking_id") 
    REFERENCES "proposal_bookings" ("proposal_booking_id")
    ON DELETE CASCADE;

  END;
  END IF;
END;
$DO$
LANGUAGE plpgsql;
