-- Milestone C: the outbox poller re-establishes the producing span's context before
-- publishing, so the Kafka producer span chains into the original order trace. A valid
-- W3C traceparent needs trace id + span id + flags; trace_id alone (32 hex) can't form
-- one. Store the full traceparent for propagation; trace_id stays for log/query correlation.
ALTER TABLE outbox ADD COLUMN traceparent VARCHAR(55);
