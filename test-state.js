const state = {
  currentWeek: {
    days: [
      {
        day: 'monday',
        highTask: undefined,
        mediumTasks: [],
        smallTasks: [
          { id: '1', title: 'test', day: 'monday', priority: 'low', status: 'pending' }
        ]
      }
    ]
  }
};

const taskId = '1';
const localUpdates = { day: 'monday', priority: 'low' };

function processTasksForDay(dayPlan, allTasks) {
  const dayTasks = allTasks.filter(t => t.day === dayPlan.day)
  const highTask = dayTasks.find(t => t.priority === 'high')
  const mediumTasks = dayTasks.filter(t => t.priority === 'medium')
  const smallTasks = dayTasks.filter(t => t.priority === 'low')
  const done = dayTasks.filter(t => t.status === 'done').length
  const total = dayTasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  return { ...dayPlan, progress, highTask, mediumTasks, smallTasks }
}

try {
  const allTasks = state.currentWeek.days.flatMap(d => 
    [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean)
  );
  console.log('allTasks', allTasks);

  const updatedTasks = allTasks.map(t => t.id === taskId ? { ...t, ...localUpdates } : t);
  console.log('updatedTasks', updatedTasks);

  const newDays = state.currentWeek.days.map(d => processTasksForDay(
    { ...d, highTask: undefined, mediumTasks: [], smallTasks: [] },
    updatedTasks
  ));
  console.log('newDays', newDays);
} catch (e) {
  console.error("ERROR", e);
}
