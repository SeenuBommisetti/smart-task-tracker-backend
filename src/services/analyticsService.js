const db = require('../config/db');

const getCompletionRate = async (userId) => {
  const result = await db.query(
    `SELECT
       COUNT(*)::int AS total_tasks,
       COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tasks,
       COALESCE(
         ROUND(
           (COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100,
           2
         ),
         0
       ) AS completion_rate
     FROM tasks
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
};

const getAverageCompletionTime = async (userId) => {
  const result = await db.query(
    `SELECT
       AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) AS avg_completion_seconds
     FROM tasks
     WHERE user_id = $1
       AND status = 'completed'
       AND completed_at IS NOT NULL`,
    [userId]
  );

  const avgSeconds = Number(result.rows[0].avg_completion_seconds) || 0;

  return {
    averageCompletionSeconds: Math.round(avgSeconds),
    averageCompletionHours: Number((avgSeconds / 3600).toFixed(2))
  };
};

const getTasksCompletedPerDay = async (userId) => {
  const result = await db.query(
    `WITH last_seven_days AS (
       SELECT generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         INTERVAL '1 day'
       )::date AS day
     )
     SELECT
       TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
       COALESCE(COUNT(t.id), 0)::int AS completed_count
     FROM last_seven_days d
     LEFT JOIN tasks t
       ON DATE(t.completed_at) = d.day
      AND t.user_id = $1
      AND t.status = 'completed'
     GROUP BY d.day
     ORDER BY d.day ASC`,
    [userId]
  );

  return result.rows;
};

const getMostProductiveDay = async (userId) => {
  const result = await db.query(
    `SELECT
       TRIM(TO_CHAR(completed_at, 'Day')) AS day_of_week,
       COUNT(*)::int AS completed_count
     FROM tasks
     WHERE user_id = $1
       AND status = 'completed'
       AND completed_at IS NOT NULL
     GROUP BY day_of_week
     ORDER BY completed_count DESC, day_of_week ASC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || {
    day_of_week: null,
    completed_count: 0
  };
};

const getDashboardInsights = async (userId) => {
  const [completionRate, averageTime, completedPerDay, productiveDay] = await Promise.all([
    getCompletionRate(userId),
    getAverageCompletionTime(userId),
    getTasksCompletedPerDay(userId),
    getMostProductiveDay(userId)
  ]);

  return {
    completion: {
      totalTasks: completionRate.total_tasks,
      completedTasks: completionRate.completed_tasks,
      completionRate: Number(completionRate.completion_rate)
    },
    averageCompletionTime: averageTime,
    tasksCompletedPerDay: completedPerDay.map((row) => ({
      date: row.date,
      completedCount: row.completed_count
    })),
    mostProductiveDay: {
      dayOfWeek: productiveDay.day_of_week,
      completedCount: productiveDay.completed_count
    }
  };
};

module.exports = {
  getDashboardInsights
};
