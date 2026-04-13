const updates = {
  title: "meet with Data Anaysis committe",
  startTime: undefined,
  estimatedTime: "1",
  description: undefined,
  day: "monday",
  priority: "low"
};

const payload = { ...updates };
if (updates.startTime !== undefined) {
  payload.start_time = updates.startTime;
  delete payload.startTime;
}
if (updates.estimatedTime !== undefined) {
  payload.estimated_duration = updates.estimatedTime;
  delete payload.estimatedTime;
}

console.log(payload);
